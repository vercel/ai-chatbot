// Stateless: Votes managed client-side
// Returns empty array for compatibility
export function GET() {
  return Response.json([], { status: 200 });
}

export function PATCH() {
  // Stateless: Votes managed client-side, no persistence
  return new Response("Vote recorded (client-side only)", { status: 200 });
}
