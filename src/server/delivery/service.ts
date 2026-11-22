import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import { createCaricatureAdapter } from "../caricature/index.ts";
import type { GenerationRequest, ImageEditAdapter } from "../ports.ts";
import type { DeliveryConfig } from "./config.ts";
import { exportPortrait, type Artifact, type ExportFormat } from "./export.ts";
import { cleanupExpired, jobPath, join, mkdir, publish, read, readFile, validId } from "./store.ts";

type Claim = {
  id: string; sessionId: string; ownerHash: string; inputHash: string; styleId: "caricature" | "lidar";
  createdAt: number; expiresAt: number; deadline: number; mock: boolean; format: ExportFormat;
};
type Success = { status: "SUCCEEDED"; at: number; artifact: Artifact };
type Failure = { status: "FAILED" | "TIMED_OUT"; at: number; stage: "generation" | "export"; rateLimited?: boolean };
type Terminal = Success | Failure;

export const validOwner = (value: string) => /^[\da-f]{64}$/.test(value);
const digest = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const write = (dir: string, file: string, value: unknown) => publish(join(dir, file), JSON.stringify(value));

// The loopback booth has one shared, process-local budget for new live edits.
let liveStarts: number[] = [];
function reserveLiveEdit(now: number, limits: { minute: number; hour: number }) {
  liveStarts = liveStarts.filter(at => at > now - 3_600_000);
  if (liveStarts.length >= limits.hour || liveStarts.filter(at => at > now - 60_000).length >= limits.minute) return false;
  liveStarts.push(now);
  return true;
}

export function delivery(config: DeliveryConfig, hooks: {
  clock?: () => number;
  provider?: ImageEditAdapter;
  exporter?: typeof exportPortrait;
} = {}) {
  const clock = hooks.clock || Date.now;
  const exporter = hooks.exporter || exportPortrait;

  async function lookup(id: string, owner?: string) {
    if (!validId(id)) return null;
    const dir = jobPath(config.root, id);
    const claim = await read<Claim>(join(dir, "claim.json"));
    if (!claim || claim.expiresAt <= clock() || (owner !== undefined && !equal(digest(owner), claim.ownerHash))) return null;
    return { dir, claim };
  }

  async function status(job: NonNullable<Awaited<ReturnType<typeof lookup>>>) {
    const { dir, claim } = job;
    const started = await read<{ at: number }>(join(dir, "started.json"));
    let terminal = await read<Success>(join(dir, "recovered.json")) ?? await read<Terminal>(join(dir, "terminal.json"));
    if (!terminal && clock() >= claim.deadline) {
      const stage = await hasSource(dir) ? "export" : "generation";
      await write(dir, "terminal.json", { status: "TIMED_OUT", at: clock(), stage });
      terminal = await read<Terminal>(join(dir, "terminal.json"));
    }
    return {
      id: claim.id,
      mock: claim.mock,
      status: terminal?.status ?? (started ? "RUNNING" as const : "QUEUED" as const),
      createdAt: claim.createdAt,
      startedAt: started?.at ?? null,
      updatedAt: terminal?.at ?? started?.at ?? claim.createdAt,
      completedAt: terminal?.at ?? null,
      expiresAt: claim.expiresAt,
      artifact: terminal?.status === "SUCCEEDED" ? terminal.artifact : null,
      failureStage: terminal && terminal.status !== "SUCCEEDED" ? terminal.stage : null,
      rateLimited: terminal && terminal.status !== "SUCCEEDED" ? terminal.rateLimited === true : false,
      canRecover: !!terminal && terminal.status !== "SUCCEEDED" && await hasSource(dir),
    };
  }

  async function hasSource(dir: string) {
    const image = await readFile(join(dir, "source.png")).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    return image !== null;
  }

  async function claim(request: GenerationRequest, owner: string, consentAt: number) {
    const now = clock();
    if (!validId(request.captureId) || !validId(request.sessionId) || !validOwner(owner) ||
      (request.styleId !== "caricature" && request.styleId !== "lidar") || !Number.isFinite(consentAt) || consentAt > now + 60_000 ||
      consentAt + config.ttlMs <= now || request.photo.type !== "image/jpeg" ||
      !request.photo.size || request.photo.size > 16 * 1024 * 1024) throw new Error("Invalid capture.");
    const bytes = new Uint8Array(await request.photo.arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error("Invalid JPEG.");
    const dir = jobPath(config.root, request.captureId);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const candidate: Claim = { id: request.captureId, sessionId: request.sessionId,
      ownerHash: digest(owner), inputHash: digest(bytes), styleId: request.styleId,
      createdAt: now, expiresAt: now + config.ttlMs, deadline: now + config.timeoutMs,
      mock: config.mock, format: config.format };
    const created = await write(dir, "claim.json", candidate);
    const job = await lookup(request.captureId, owner);
    if (!job || job.claim.sessionId !== candidate.sessionId || job.claim.inputHash !== candidate.inputHash) return null;
    return { job, created };
  }

  async function run(job: NonNullable<Awaited<ReturnType<typeof lookup>>>, request: GenerationRequest) {
    const { dir, claim } = job;
    if (clock() >= claim.deadline || !await write(dir, "started.json", { at: clock() })) return;
    if (config.localLiveLimits && !claim.mock && !reserveLiveEdit(clock(), config.localLiveLimits)) {
      await write(dir, "terminal.json", { status: "FAILED", at: clock(), stage: "generation", rateLimited: true });
      return;
    }
    let stage: Failure["stage"] = "generation";
    let final: Terminal;
    const stop = new AbortController();
    try {
      const provider = hooks.provider || (claim.mock
        ? createCaricatureAdapter({ IMAGE_EDIT_PROVIDER: "mock" })
        : createCaricatureAdapter());
      const work = async () => {
        if (claim.mock && config.mockDelayMs) await wait(config.mockDelayMs, undefined, { signal: stop.signal });
        stop.signal.throwIfAborted();
        if (clock() >= claim.deadline) throw new DOMException("Deadline exceeded", "TimeoutError");
        const source = await provider.edit(request, stop.signal);
        stop.signal.throwIfAborted();
        if (clock() >= claim.deadline) throw new DOMException("Deadline exceeded", "TimeoutError");
        stage = "export";
        const bytes = new Uint8Array(await source.arrayBuffer());
        try { await publish(join(dir, "source.png"), bytes); }
        catch (error) {
          stop.signal.throwIfAborted();
          if (clock() >= claim.deadline) throw error;
          await publish(join(dir, "source.png"), bytes);
        }
        try { return await exporter(dir, claim.format); }
        catch (error) {
          stop.signal.throwIfAborted();
          if (clock() >= claim.deadline) throw error;
          return exporter(dir, claim.format);
        }
      };
      const deadline = wait(Math.max(1, claim.deadline - clock()), undefined, { signal: stop.signal })
        .then(() => { throw new DOMException("Deadline exceeded", "TimeoutError"); });
      const artifact = await Promise.race([work(), deadline]);
      final = { status: "SUCCEEDED", at: clock(), artifact };
    } catch (error) {
      final = { status: clock() >= claim.deadline || (error as Error).name === "TimeoutError" ? "TIMED_OUT" : "FAILED",
        at: clock(), stage };
    } finally { stop.abort(); }
    await write(dir, "terminal.json", final);
  }

  async function recover(job: NonNullable<Awaited<ReturnType<typeof lookup>>>) {
    const current = await status(job);
    if (!current.canRecover) return current;
    const artifact = await exporter(job.dir, job.claim.format);
    await write(job.dir, "recovered.json", { status: "SUCCEEDED", at: clock(), artifact });
    return status(job);
  }

  async function photo(job: NonNullable<Awaited<ReturnType<typeof lookup>>>) {
    const { artifact } = await status(job);
    if (!artifact || clock() >= job.claim.expiresAt) return null;
    const bytes = await readFile(join(job.dir, artifact.filename));
    if (digest(bytes) !== artifact.sha256) throw new Error("Stored portrait integrity check failed.");
    return { bytes: new Uint8Array(bytes), artifact };
  }

  async function sourcePhoto(job: NonNullable<Awaited<ReturnType<typeof lookup>>>) {
    if (clock() >= job.claim.expiresAt) return null;
    const bytes = await readFile(join(job.dir, "source.png")).catch(() => null);
    if (!bytes) return null;
    return {
      bytes: new Uint8Array(bytes),
      artifact: {
        contentType: "image/png" as const,
        filename: "source.png",
        width: 1024,
        height: 1024,
        bytes: bytes.byteLength,
        sha256: digest(bytes),
      },
    };
  }

  return { claim, lookup, status, run, recover, photo, sourcePhoto, cleanup: () => cleanupExpired(config.root, clock()) };
}
