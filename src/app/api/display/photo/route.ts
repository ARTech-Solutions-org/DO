import { NextResponse } from "next/server";
import { getDisplayState } from "../../../../server/display-state";
import { deliveryConfig } from "../../../../server/delivery/config";
import { delivery } from "../../../../server/delivery/service";
import { photoResponse } from "../../../../server/delivery/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getDisplayState();
  if (state.status !== "photo" || !state.jobId) {
    return new NextResponse(null, { status: 404 });
  }

  const config = deliveryConfig();
  if (!config) {
    return new NextResponse(null, { status: 503 });
  }

  const service = delivery(config);
  const job = await service.lookup(state.jobId);
  if (!job) {
    return new NextResponse(null, { status: 404 });
  }

  const photo = await service.photo(job);
  if (!photo) {
    return new NextResponse(null, { status: 404 });
  }

  return photoResponse(photo, false);
}
