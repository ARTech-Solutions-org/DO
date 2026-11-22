import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
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

let cachedFrame: Buffer | null = null;

async function getFrameBuffer(): Promise<Buffer | null> {
  if (cachedFrame) return cachedFrame;
  const candidates = [
    join(process.cwd(), "public", "artwork", "brand", "frame-background.png"),
    join(process.cwd(), "src", "server", "delivery", "frame-background.png"),
    "G:\\Downloads\\Background.png",
  ];
  for (const candidate of candidates) {
    try {
      const data = await fs.readFile(candidate);
      if (data && data.length > 0) {
        cachedFrame = data;
        return data;
      }
    } catch {}
  }
  return null;
}

export async function composeFramedPortrait(source: Buffer, format: ExportFormat): Promise<Buffer> {
  const frame = await getFrameBuffer();
  if (!frame) {
    return format === "png"
      ? source
      : await sharp(source).webp({ lossless: true }).toBuffer();
  }

  // Frame is 1024x1535 with transparent cutout:
  // x: 53..970 (width 918), y: 219..1177 (height 959).
  // Scale 1024x1024 source to 924x965 to cover the window with 4px bleed behind frame borders:
  const scaledPortrait = await sharp(source)
    .resize(924, 965, { fit: "cover", position: "center" })
    .toBuffer();

  const pipeline = sharp({
    create: {
      width: 1024,
      height: 1535,
      channels: 4,
      background: { r: 11, g: 9, b: 14, alpha: 1 },
    },
  }).composite([
    { input: scaledPortrait, left: 50, top: 216 },
    { input: frame, left: 0, top: 0 },
  ]);

  if (format === "png") {
    return pipeline.png({ compressionLevel: 8 }).toBuffer();
  } else {
    return pipeline.webp({ lossless: true }).toBuffer();
  }
}

export async function exportPortrait(dir: string, format: ExportFormat): Promise<Artifact> {
  const filename = "portrait." + format;
  const source = await readFile(join(dir, "source.png"));
  const info = await sharp(source).metadata();
  if (info.format !== "png" || info.hasAlpha || info.width !== 1024 || info.height !== 1024 || (info.pages ?? 1) !== 1) {
    throw new Error("Unexpected source portrait.");
  }
  const artifactPath = join(dir, filename);
  let bytes = await readFile(artifactPath).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) {
    const composed = await composeFramedPortrait(source, format);
    await publish(artifactPath, composed);
    bytes = await readFile(artifactPath);
  }
  const meta = await sharp(bytes).metadata();
  return {
    filename,
    contentType: format === "png" ? "image/png" : "image/webp",
    width: meta.width || 1024,
    height: meta.height || 1535,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
