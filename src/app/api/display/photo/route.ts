import { readDisplayPhoto } from "../../../../server/display-state";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const headers = { "Cache-Control": "private, no-store", "Content-Type": "image/jpeg" };
  if (!id) return new Response(null, { status: 404, headers });
  try {
    const photo = await readDisplayPhoto(id);
    return new Response(photo, { status: photo ? 200 : 404, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
