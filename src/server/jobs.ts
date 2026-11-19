import "server-only";
import { createCaricatureAdapter } from "./caricature/index.ts";
import type { GenerationRequest, ImageEditAdapter, ResultStorage } from "./ports.ts";

export type Job =
  | { id: string; status: "running" | "failed" }
  | { id: string; status: "succeeded"; resultId: string };

export interface JobRepository {
  // Claim atomically. Only the creator may call the image provider.
  claim(key: string): Promise<{ job: Job; created: boolean }>;
  get(id: string): Promise<Job | undefined>;
  finish(job: Job): Promise<void>;
}

// Single-process scaffold. Replace with a durable unique constraint before live jobs.
export class MemoryJobRepository implements JobRepository {
  private readonly keys = new Map<string, string>();
  private readonly jobs = new Map<string, Job>();

  async claim(key: string) {
    const id = this.keys.get(key);
    if (id) return { job: this.jobs.get(id)!, created: false };
    const job: Job = { id: crypto.randomUUID(), status: "running" };
    this.keys.set(key, job.id);
    this.jobs.set(job.id, job);
    return { job, created: true };
  }

  async get(id: string) { return this.jobs.get(id); }

  async finish(job: Job) { this.jobs.set(job.id, job); }
}

export function processCaricature(request: GenerationRequest, repository: JobRepository, storage: Pick<ResultStorage, "save">) {
  return processGeneration(request, repository, createCaricatureAdapter(), storage);
}

export async function processGeneration(
  request: GenerationRequest,
  repository: JobRepository,
  provider: ImageEditAdapter,
  storage: Pick<ResultStorage, "save">,
): Promise<Job> {
  const key = JSON.stringify([request.sessionId, request.captureId, request.styleId]);
  const { job, created } = await repository.claim(key);
  if (!created) return job;
  let outcome: Job;
  try {
    const image = await provider.edit(request);
    const { resultId } = await storage.save(job.id, image);
    outcome = { id: job.id, status: "succeeded", resultId };
  } catch {
    // Keep the reservation even after an uncertain upstream outcome.
    outcome = { id: job.id, status: "failed" };
  }
  await repository.finish(outcome);
  return outcome;
}
