import { getDisplayState, subscribeDisplayState, type DisplayState } from "../../../../server/display-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state immediately
      const initial = getDisplayState();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

      cleanup = subscribeDisplayState((state: DisplayState) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          // stream closed
        }
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
