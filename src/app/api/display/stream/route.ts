// Older display tabs also poll /api/display. A 204 stops EventSource reconnects.
export function GET() {
  return new Response(null, { status: 204 });
}
