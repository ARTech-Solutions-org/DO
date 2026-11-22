import "server-only";
import { getPresignedDownloadUrl, getPresignedMetadataUrl, getR2Config, uploadToR2 } from "./delivery/r2.ts";

type DisplayState = { jobId?: string; status: "idle" | "processing" | "photo"; updatedAt: number };
const initial: DisplayState = { status: "idle", updatedAt: 0 };
const slot = "secondary-display/" + (process.env.VERCEL_ENV || "local") + "/current";
const memory = globalThis as typeof globalThis & { boothDisplay?: { state: DisplayState; photo?: Buffer } };

function remote() {
  // Local test and development sessions must never replace the event's live portrait.
  if (!process.env.VERCEL) return false;
  if (!getR2Config()) throw new Error("Display storage is unavailable");
  return true;
}

async function current() {
  const url = getPresignedMetadataUrl(slot, 60)!;
  const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return { state: initial, etag: null };
  if (!response.ok) throw new Error("Cannot read display state");
  const state: DisplayState = {
    jobId: response.headers.get("x-amz-meta-job") || undefined,
    updatedAt: Number(response.headers.get("x-amz-meta-updated")),
    status: response.headers.get("x-amz-meta-status") === "photo" ? "photo" : response.headers.get("x-amz-meta-status") === "processing" ? "processing" : "idle",
  };
  return { state, etag: response.headers.get("etag") };
}

export async function readDisplay() {
  return remote() ? (await current()).state : memory.boothDisplay?.state || initial;
}

export async function writeDisplay(next: DisplayState, photo?: Buffer) {
  const shared = remote();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { state, etag } = shared ? await current() : { state: memory.boothDisplay?.state || initial, etag: null };
    if (next.updatedAt <= state.updatedAt) return;
    if (next.status === "idle" && (state.status === "photo" || state.status === "processing") && next.jobId !== state.jobId) return;
    if (!shared) {
      memory.boothDisplay = { state: next, photo };
      return;
    }
    try {
      await uploadToR2({ key: slot, buffer: photo || Buffer.from("0"), contentType: photo ? "image/jpeg" : "text/plain",
        headers: { "x-amz-meta-job": next.jobId!, "x-amz-meta-updated": String(next.updatedAt),
          "x-amz-meta-status": next.status, ...(etag ? { "if-match": etag } : { "if-none-match": "*" }) } });
      return;
    } catch (error) {
      if (!(error instanceof Error) || !/R2 upload failed: (409|412)/.test(error.message)) throw error;
    }
  }
  throw new Error("Display update conflicted");
}

export async function readDisplayPhoto(id: string) {
  if (!remote()) {
    const record = memory.boothDisplay;
    return record?.state.jobId === id && record.photo ? new Uint8Array(record.photo) : null;
  }
  const response = await fetch(getPresignedDownloadUrl(slot, 60)!, { cache: "no-store" });
  if (response.status !== 404 && !response.ok) throw new Error("Cannot read display photo");
  if (response.status === 404 || response.headers.get("x-amz-meta-job") !== id || response.headers.get("x-amz-meta-status") !== "photo") {
    await response.body?.cancel();
    return null;
  }
  return response.body;
}
