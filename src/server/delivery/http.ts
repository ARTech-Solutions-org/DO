import "server-only";
import type { Artifact } from "./export.ts";

export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export function photoResponse(photo: { bytes: Uint8Array<ArrayBuffer>; artifact: Artifact }, download: boolean) {
  const { bytes, artifact } = photo;
  return new Response(bytes, { headers: {
    ...privateHeaders,
    "Content-Type": artifact.contentType,
    "Content-Length": String(artifact.bytes),
    "Content-Disposition": (download ? "attachment" : "inline") + '; filename="do-hotels-' + artifact.filename + '"',
  } });
}

export async function readCapture(request: Request) {
  const limit = 16 * 1024 * 1024;
  if (request.headers.get("content-type") !== "image/jpeg" || !request.body ||
      Number(request.headers.get("content-length")) > limit) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); return null; }
      chunks.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  return new Blob(chunks, { type: "image/jpeg" });
}
