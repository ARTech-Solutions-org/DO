import { timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { after } from "next/server";
import { deliveryConfig } from "../../../../../server/delivery/config";
import { photoResponse, privateHeaders, readCapture } from "../../../../../server/delivery/http";
import { isLoopback, publicQr, secretFor, tokenFor } from "../../../../../server/delivery/links";
import { uploadToR2 } from "../../../../../server/delivery/r2";
import { delivery, validOwner } from "../../../../../server/delivery/service";
import type { GenerationRequest } from "../../../../../server/ports";

type Context = { params: Promise<{ jobId: string; resource?: string[] }> };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders });
const error = (status: number) => json({ error: "Booth request unavailable." }, status);
export const maxDuration = 310;

async function handle(request: Request, context: Context) {
  try {
    const config = deliveryConfig();
    if (!config) return error(503);
    if (config.local) {
      if (!isLoopback(request.headers.get("host"))) return error(404);
    } else {
      const supplied = Buffer.from(request.headers.get("x-booth-kiosk") || "");
      const expected = Buffer.from(config.kioskSecret!);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return error(404);
    }
    const owner = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
    if (!validOwner(owner)) return error(404);
    const { jobId, resource } = await context.params;
    if (resource && resource.length > 1) return error(404);
    const action = resource?.[0];
    const service = delivery(config);
    if (request.method === "POST" && !action) {
      const photo = await readCapture(request);
      if (!photo) return error(400);
      const styleId = request.headers.get("x-booth-style");
      if (styleId !== "caricature") return error(400);
      const capture: GenerationRequest = { sessionId: request.headers.get("x-booth-session") || "",
        captureId: jobId, styleId, photo };
      let claim;
      try { claim = await service.claim(capture, owner, Date.parse(request.headers.get("x-booth-consent") || "")); }
      catch (fault) { if ((fault as Error).message.startsWith("Invalid ")) return error(400); throw fault; }
      if (!claim) return error(409);
      if (claim.created) after(() => service.run(claim.job, capture).catch(() => {}));
      return json(await service.status(claim.job), 202);
    }
    const job = await service.lookup(jobId, owner);
    if (!job) return error(404);
    if (request.method === "GET" && !action) return json(await service.status(job));
    if (request.method === "POST" && action === "recover") return json(await service.recover(job));
    if (request.method === "GET" && action === "portrait") {
      const photo = await service.photo(job);
      return photo ? photoResponse(photo, false) : error(404);
    }
    if (request.method === "POST" && action === "link") {
      const photo = await service.photo(job);
      if (!photo) return error(404);

      let r2Url: string | null = null;
      try {
        const ext = photo.artifact.contentType === "image/webp" ? "webp" : "png";
        const key = `photos/do-hotels-${jobId}.${ext}`;
        r2Url = await uploadToR2({
          key,
          buffer: photo.bytes,
          contentType: photo.artifact.contentType,
        });
      } catch (r2Err) {
        console.error("R2 upload error:", r2Err);
      }

      const token = tokenFor(jobId, job.claim.expiresAt, secretFor(config, job.claim.ownerHash));
      let link: { url: string; qr: string | null };
      if (r2Url) {
        link = {
          url: r2Url,
          qr: await QRCode.toDataURL(r2Url, { errorCorrectionLevel: "M", margin: 4, scale: 12 }),
        };
      } else if (config.origin) {
        link = await publicQr(config.origin, token);
      } else {
        link = { url: "/download/" + token, qr: null };
      }
      return json({ ...link, r2Url, idleSeconds: config.idleSeconds, expiresAt: job.claim.expiresAt });
    }
    return error(404);
  } catch {
    return error(503);
  }
}

export const GET = handle;
export const POST = handle;
