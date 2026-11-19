import { NextRequest, NextResponse } from "next/server";
import { getDisplayState, setDisplayState } from "../../../server/display-state";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getDisplayState(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { status, photoUrl, jobId } = body;
    if (status !== "idle" && status !== "photo") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const effectivePhotoUrl = status === "photo"
      ? (photoUrl && photoUrl.startsWith("http") ? photoUrl : `/api/display/photo?t=${Date.now()}`)
      : undefined;
    const updated = setDisplayState({
      status,
      photoUrl: effectivePhotoUrl,
      jobId: status === "photo" ? jobId : undefined,
    });
    return NextResponse.json(updated, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
