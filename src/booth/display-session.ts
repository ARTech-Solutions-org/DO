type EventData = { jobId: string; updatedAt: number; status: "photo" | "idle" };
const key = "booth-display-session";
let activeId: string | null = null;
let pending: AbortController | undefined;
let lastTime = 0;

async function preview(photo: Blob) {
  if (photo.size <= 800_000) return photo;
  const bitmap = await createImageBitmap(photo);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("Preview unavailable")), "image/jpeg", .85));
  } finally { bitmap.close(); }
}

function publish(event: EventData, photo?: Blob) {
  try {
    const channel = new BroadcastChannel("do_booth_display");
    channel.postMessage({ ...event, photo });
    channel.close();
  } catch { /* The server also relays to separate devices. */ }
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  async function sync() {
    const body = photo ? await preview(photo).catch(() => photo) : JSON.stringify({ status: "idle" });
    const headers: Record<string, string> = { "Content-Type": body instanceof Blob ? body.type : "application/json",
      "X-Display-Job": event.jobId, "X-Display-Time": String(event.updatedAt) };
    if (photo) headers["X-Display-Source"] = "result";
    for (let tries = 0; !controller.signal.aborted; tries++) {
      try {
        const response = await fetch("/api/display", { method: "POST",
          headers,
          body,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]) });
        if (response.ok && event.status === "idle") {
          try { if (sessionStorage.getItem(key) === event.jobId) sessionStorage.removeItem(key); } catch { /* Storage unavailable. */ }
        }
        if (response.ok || (response.status >= 400 && response.status < 500)) return;
      } catch { /* Retry the current state after a transient connection failure. */ }
      if (!controller.signal.aborted) await new Promise(resolve => setTimeout(resolve, Math.min(5000, 500 * (tries + 1))));
    }
  }
  void sync();
}

function timestamp() {
  lastTime = Math.max(Date.now(), lastTime + 1);
  return lastTime;
}

export function displayResult(jobId: string, photo: Blob) {
  if (activeId === jobId) return;
  activeId = jobId;
  try { sessionStorage.setItem(key, jobId); } catch { /* In-memory fallback. */ }
  publish({ jobId, status: "photo", updatedAt: timestamp() }, photo);
}

export function clearDisplayedCapture() {
  let jobId = activeId;
  try { jobId ??= sessionStorage.getItem(key); } catch { /* Storage unavailable. */ }
  activeId = null;
  if (jobId) publish({ jobId, status: "idle", updatedAt: timestamp() });
}
