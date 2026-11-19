import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log(">>> [TABLET_DEBUG_LOG]:", JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(">>> [TABLET_DEBUG_LOG_ERROR]:", err);
    return NextResponse.json({ ok: false });
  }
}
