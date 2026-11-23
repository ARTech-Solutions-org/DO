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

type FrameInfo = {
  buffer: Buffer;
  hash: string;
  width: number;
  height: number;
  cutout: { left: number; top: number; width: number; height: number };
};

let cachedFrameInfo: FrameInfo | null = null;

async function loadFrameInfo(): Promise<FrameInfo | null> {
  const candidates = [
    join(process.cwd(), "public", "artwork", "brand", "frame-background.png"),
    join(process.cwd(), "public", "artwork", "brand", "Background (1).png"),
    join(process.cwd(), "src", "server", "delivery", "frame-background.png"),
    "G:\\Downloads\\Background.png",
  ];
  let buffer: Buffer | null = null;
  for (const candidate of candidates) {
    try {
      const data = await fs.readFile(candidate);
      if (data && data.length > 0) {
        buffer = data;
        break;
      }
    } catch {}
  }
  if (!buffer) return null;

  const hash = createHash("sha256").update(buffer).digest("hex");
  if (cachedFrameInfo && cachedFrameInfo.hash === hash) {
    return cachedFrameInfo;
  }

  const frameImage = sharp(buffer);
  const meta = await frameImage.metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1535;

  let cutout = { left: 50, top: 216, width: 924, height: 965 };
  try {
    const raw = await frameImage.raw().toBuffer({ resolveWithObject: true });
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasCutout = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = raw.data[(y * width + x) * raw.info.channels + 3];
        if (alpha < 128) {
          hasCutout = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (hasCutout) {
      const bleed = 4;
      const left = Math.max(0, minX - bleed);
      const top = Math.max(0, minY - bleed);
      const w = (maxX - minX + 1) + bleed * 2;
      const h = (maxY - minY + 1) + bleed * 2;
      cutout = { left, top, width: w, height: h };
    }
  } catch (err) {
    console.warn("Cutout detection failed, using fallback:", err);
  }

  cachedFrameInfo = { buffer, hash, width, height, cutout };
  return cachedFrameInfo;
}

export async function composeFramedPortrait(source: Buffer, format: ExportFormat): Promise<Buffer> {
  const frameInfo = await loadFrameInfo();
  if (!frameInfo) {
    return format === "png"
      ? source
      : await sharp(source).webp({ lossless: true }).toBuffer();
  }

  const { buffer: frame, width, height, cutout } = frameInfo;

  const scaledPortrait = await sharp(source)
    .resize(cutout.width, cutout.height, { fit: "cover", position: "center" })
    .toBuffer();

  const pipeline = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 11, g: 9, b: 14, alpha: 1 },
    },
  }).composite([
    { input: scaledPortrait, left: cutout.left, top: cutout.top },
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
