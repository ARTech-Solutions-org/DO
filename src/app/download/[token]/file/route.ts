import { photoResponse, privateHeaders } from "../../../../server/delivery/http";
import { openDownload } from "../../../../server/delivery/links";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const link = await openDownload(token, request.headers.get("host"));
    const photo = await link?.read();
    if (photo) return photoResponse(photo, new URL(request.url).searchParams.has("save"));
  } catch { /* Storage failures use the same unavailable response. */ }
  return new Response("Photo unavailable or expired.", { status: 404, headers: privateHeaders });
}
