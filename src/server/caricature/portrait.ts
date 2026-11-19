import "server-only";
import sharp from "sharp";

export const outputSize = 1024;
const purple = [150, 107, 252] as const;

export async function preparePortrait(photo: Blob) {
  if (!photo.size || photo.size > 16 * 1024 * 1024) throw new Error("Invalid portrait size.");
  const input = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 32_000_000 });
  const meta = await input.metadata();
  if (!["jpeg", "png", "webp"].includes(meta.format) || (meta.pages ?? 1) !== 1) {
    throw new Error("Expected a single portrait image.");
  }
  return input.autoOrient().resize({ width: outputSize, height: outputSize,
    fit: "inside", withoutEnlargement: true }).toColourspace("srgb").jpeg({ quality: 90 }).toBuffer();
}

export async function compositePortrait(
  layer: Buffer,
  background: readonly [number, number, number] = purple
): Promise<Blob> {
  if (layer.length > 16 * 1024 * 1024) throw new Error("Oversized provider image.");
  const input = sharp(layer, { limitInputPixels: 32_000_000 });
  const meta = await input.metadata();

  if (!meta.hasAlpha) {
    const png = await input
      .resize(outputSize, outputSize, { fit: "cover" })
      .toColourspace("srgb")
      .png({ quality: 90 })
      .toBuffer();
    return new Blob([new Uint8Array(png)], { type: "image/png" });
  }

  if (meta.format !== "png" || (meta.pages ?? 1) !== 1 ||
      meta.width !== outputSize || meta.height !== outputSize) {
    throw new Error("Expected one 1024-square transparent PNG.");
  }
  const rgba = await input.toColourspace("srgb").raw({ depth: "uchar" }).toBuffer();
  const pixels = outputSize * outputSize;
  const rgb = Buffer.allocUnsafe(pixels * 3);
  let clear = 0;
  let solid = 0;
  for (let p = 0; p < pixels; p++) {
    const alpha = rgba[p * 4 + 3];
    if (alpha === 0) clear++;
    if (alpha === 255) solid++;
    if (alpha && (p < outputSize || p >= pixels - outputSize || p % outputSize === 0 || p % outputSize === outputSize - 1)) {
      throw new Error("Expected transparent padding around the subject.");
    }
    for (let c = 0; c < 3; c++) {
      rgb[p * 3 + c] = Math.round((rgba[p * 4 + c] * alpha + background[c] * (255 - alpha)) / 255);
    }
  }
  if (clear < pixels * 0.1 || solid < pixels * 0.02) throw new Error("Insufficient subject or background in matte.");
  const png = await sharp(rgb, { raw: { width: outputSize, height: outputSize, channels: 3 } }).png().toBuffer();
  return new Blob([new Uint8Array(png)], { type: "image/png" });
}
