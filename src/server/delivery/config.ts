import "server-only";
import { isIP } from "node:net";
import { isAbsolute, resolve } from "node:path";

export function publicOrigin(value: string) {
  const url = new URL(value);
  const host = url.hostname;
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash || isIP(host) || !host.includes(".") ||
      /\.(localhost|local|internal|test|invalid|example|lan|home|onion)$/i.test(host) ||
      /(^|\.)example\.(org|net|com)$/i.test(host) || host.endsWith(".")) {
    throw new Error("A public HTTPS origin is required.");
  }
  return url.origin;
}

function seconds(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error("Invalid booth timing configuration.");
  return parsed;
}

export function deliveryConfig(env: Readonly<Record<string, string | undefined>> = process.env) {
  const mode = env.BOOTH_MODE;
  if (mode !== "local" && mode !== "local-live" && mode !== "hosted") return null;
  const mock = mode === "local";
  const local = mode !== "hosted";
  const apiKey = env.IMAGE_EDIT_API_KEY || env.OPENAI_API_KEY;
  if (mode === "local-live" && (env.IMAGE_EDIT_PROVIDER !== "openai" || !apiKey)) {
    throw new Error("Local live mode requires a server-side OpenAI key.");
  }
  if (!local && (!env.BOOTH_DATA_DIR || !isAbsolute(env.BOOTH_DATA_DIR) || !env.BOOTH_PUBLIC_ORIGIN ||
    !env.BOOTH_KIOSK_SECRET || env.BOOTH_KIOSK_SECRET.length < 32 ||
    !env.BOOTH_TOKEN_SECRET || env.BOOTH_TOKEN_SECRET.length < 32 || env.IMAGE_EDIT_PROVIDER !== "openai" ||
    !apiKey)) throw new Error("Hosted booth configuration is incomplete.");
  const format = env.BOOTH_EXPORT_FORMAT || "png";
  if (format !== "png" && format !== "webp") throw new Error("Unsupported lossless export format.");
  return {
    local,
    mock,
    localLiveLimits: mode === "local-live" ? {
      minute: seconds(env.RATE_LIMIT_PER_MINUTE, 6, 1, 1000),
      hour: seconds(env.RATE_LIMIT_PER_HOUR, 60, 1, 10000),
    } : null,
    origin: local ? null : publicOrigin(env.BOOTH_PUBLIC_ORIGIN!),
    root: resolve(env.BOOTH_DATA_DIR || (process.env.VERCEL ? "/tmp/guest-data" : "guest-data")),
    kioskSecret: env.BOOTH_KIOSK_SECRET,
    tokenSecret: env.BOOTH_TOKEN_SECRET,
    format,
    ttlMs: 1000 * seconds(env.BOOTH_RETENTION_SECONDS, 86400, 600, 604800),
    timeoutMs: 1000 * seconds(env.BOOTH_JOB_TIMEOUT_SECONDS, 200, 1, 300),
    idleSeconds: seconds(env.BOOTH_QR_IDLE_SECONDS, 60, 10, 600),
    mockDelayMs: mock ? 1000 * seconds(env.BOOTH_MOCK_DELAY_SECONDS, 2, 0, 300) : 0,
  } as const;
}

export type DeliveryConfig = NonNullable<ReturnType<typeof deliveryConfig>>;
