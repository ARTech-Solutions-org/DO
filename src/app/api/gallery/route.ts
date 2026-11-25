import { listArchivedPhotos } from "../../../server/delivery/r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 1000) : 500;

    const photos = await listArchivedPhotos({ limit });

    return Response.json(
      {
        photos,
        total: photos.length,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Gallery API error:", error);
    return Response.json(
      {
        error: "Failed to load archived gallery photos",
        photos: [],
        total: 0,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
