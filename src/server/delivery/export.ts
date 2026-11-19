import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { join, publish, readFile } from "./store.ts";

export type ExportFormat = "png" | "webp";
export type Artifact = {
  contentType: "image/png" | "image/webp";
  filename: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
};

export async function exportPortrait(dir: string, format: ExportFormat): Promise<Artifact> {
  const filename = "portrait." + format;
  const source = await readFile(join(dir, "source.png"));
  const info = await sharp(source).metadata();
  if (info.format !== "png" || info.hasAlpha || info.width !== 1024 || info.height !== 1024 || (info.pages ?? 1) !== 1) {
    throw new Error("Unexpected source portrait.");
  }
  // Frame and official logo layers are pending approval. Preserve the native square pixels.
  const artifactPath = join(dir, filename);
  let bytes = await readFile(artifactPath).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) {
    const composed = format === "png" ? source : await sharp(source).webp({ lossless: true }).toBuffer();
    await publish(artifactPath, composed);
    bytes = await readFile(artifactPath);
  }
  return { filename, contentType: format === "png" ? "image/png" : "image/webp",
    width: info.width, height: info.height, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
