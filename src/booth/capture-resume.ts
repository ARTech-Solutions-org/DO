import type { StyleId } from "./config";

export type Attempt = { jobId: string; sessionId: string; consentAt: string; styleId: StyleId; owner: string };
const pointer = "booth-attempt";

export function attemptPointer(): Attempt | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(pointer) || "null") as Attempt | null;
    return value && typeof value.jobId === "string" && typeof value.owner === "string" && (value.styleId === "caricature" || value.styleId === "lidar") ? value : null;
  } catch { return null; }
}

async function captureStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("booth-capture", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pending");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("pending", mode);
      const request = work(transaction.objectStore("pending"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export async function bufferCapture(attempt: Attempt, photo: Blob) {
  await captureStore("readwrite", store => {
    const scan = store.openCursor();
    scan.onsuccess = () => {
      const cursor = scan.result;
      if (!cursor) return;
      if (cursor.value.expires <= Date.now()) cursor.delete();
      cursor.continue();
    };
    return store.put({ photo, expires: Date.now() + 600_000 }, attempt.jobId);
  });
  sessionStorage.setItem(pointer, JSON.stringify(attempt));
}

export async function readCapture(jobId: string) {
  const saved = await captureStore("readonly", store => store.get(jobId)) as { photo: Blob; expires: number } | undefined;
  if (saved?.expires && saved.expires > Date.now()) return saved.photo;
  if (saved) void forgetCapture(jobId);
}

export function forgetCapture(jobId: string) {
  return captureStore("readwrite", store => store.delete(jobId)).catch(() => {});
}

export function clearAttempt(jobId?: string) {
  const attempt = attemptPointer();
  if (!jobId || attempt?.jobId === jobId) {
    try { sessionStorage.removeItem(pointer); } catch { /* Storage is unavailable. */ }
  }
  const bufferedId = jobId ?? attempt?.jobId;
  if (bufferedId) void forgetCapture(bufferedId);
}

export function newOwner() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
}
