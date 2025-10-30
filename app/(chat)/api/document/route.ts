// Stateless: Documents managed client-side (in-memory during chat session)
// For compatibility, return empty responses
export function GET() {
  return Response.json([], { status: 200 });
}

export function POST() {
  // Stateless: Documents created client-side, no persistence
  return Response.json({ saved: true }, { status: 200 });
}

export function DELETE() {
  // Stateless: Documents deleted client-side
  return Response.json({ deleted: true }, { status: 200 });
}
