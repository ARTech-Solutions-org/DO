import "server-only";
import type { StyleId } from "../booth/config.ts";

export interface GenerationRequest {
  sessionId: string;
  captureId: string; // Stable for this immutable capture and its retries.
  styleId: StyleId;
  photo: Blob;
}

export interface ImageEditAdapter {
  edit(request: GenerationRequest, signal?: AbortSignal): Promise<Blob>;
}

export interface ResultStorage {
  save(jobId: string, image: Blob): Promise<{ resultId: string }>;
  read(resultId: string): Promise<Blob | null>;
  remove(resultId: string): Promise<void>;
}

export interface QrDownloadAdapter {
  issue(resultId: string): Promise<{ url: URL; expiresAt: Date }>;
}
