import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { deliveryConfig, publicOrigin, type DeliveryConfig } from "./config.ts";
import { delivery } from "./service.ts";
import { validId } from "./store.ts";

export function tokenFor(id: string, expiry: number, secret: string) {
  return id + "." + createHmac("sha256", secret).update(id + ":" + expiry).digest("base64url");
}

export function matchesToken(token: string, id: string, expiry: number, secret: string) {
  const expected = tokenFor(id, expiry, secret);
  return /^[\w.-]{80}$/.test(token) && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function publicQr(origin: string, token: string) {
  const url = new URL("/download/" + token, publicOrigin(origin)).href;
  return { url, qr: await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, scale: 12 }) };
}

export function secretFor(config: DeliveryConfig, ownerHash: string) {
  return config.local ? ownerHash : config.tokenSecret!;
}

export function isLoopback(host: string | null) {
  if (!host) return false;
  if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL) return true;
  const hostname = host.split(":")[0].toLowerCase();
  return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    hostname.endsWith(".local") || hostname.endsWith(".lan") ||
    hostname.endsWith(".vercel.app") || hostname.endsWith(".nip.io");
}

export async function openDownload(token: string, host: string | null) {
  const config = deliveryConfig();
  if (!config) return null;
  if (!config.local && config.origin && !process.env.VERCEL) {
    if (host?.toLowerCase() !== new URL(config.origin).host) return null;
  }
  const id = token.split(".")[0];
  if (!validId(id)) return null;
  const service = delivery(config);
  const job = await service.lookup(id);
  if (!job || !matchesToken(token, id, job.claim.expiresAt, secretFor(config, job.claim.ownerHash))) return null;
  const { artifact } = await service.status(job);
  return artifact ? { artifact, local: config.local, read: () => service.photo(job) } : null;
}
