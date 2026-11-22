import sharp from "sharp";
import { readDisplay, writeDisplay } from "../../../server/display-state";

export const dynamic = "force-dynamic";
const noCache = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const state = await readDisplay();
    return Response.json({ ...state, photoUrl: state.status === "photo" ? "/api/display/photo?id=" + state.jobId : undefined }, { headers: noCache });
  } catch { return new Response(null, { status: 503, headers: noCache }); }
}

export async function POST(request: Request) {
  const jobId = request.headers.get("x-display-job") || "";
  const updatedAt = Number(request.headers.get("x-display-time"));
  if (!/^[\w-]{1,80}$/.test(jobId) || !Number.isSafeInteger(updatedAt) || updatedAt <= 0 || updatedAt > Date.now() + 300000) {
    return new Response(null, { status: 400 });
  }
  let photo: Buffer | undefined;
  let nextStatus: "idle" | "processing" | "photo" = "idle";
  try {
    const mime = request.headers.get("content-type");
    if (mime === "image/png" || mime === "image/webp" || mime === "image/jpeg") {
      if (request.headers.get("x-display-source") !== "result") return new Response(null, { status: 400 });
      const bytes = Buffer.from(await request.arrayBuffer());
      if (bytes.length > 4_400_000) return new Response(null, { status: 413 });
      const input = sharp(bytes, { limitInputPixels: 24000000 });
      const meta = await input.metadata();
      if (mime !== "image/" + meta.format || (meta.pages ?? 1) !== 1) return new Response(null, { status: 400 });
      photo = await input.rotate().resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
      nextStatus = "photo";
    } else {
      const payload = await request.json();
      if (payload.status !== "idle" && payload.status !== "processing") return new Response(null, { status: 400 });
      nextStatus = payload.status;
    }
  } catch { return new Response(null, { status: 400 }); }
  try {
    await writeDisplay({ jobId, updatedAt, status: photo ? "photo" : nextStatus }, photo);
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 503 }); }
}
