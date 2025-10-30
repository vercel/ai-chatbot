// Stateless: Chat history managed client-side
// Returns empty array for compatibility
export function GET() {
  return Response.json({ results: [], hasMore: false });
}

export function DELETE() {
  // Stateless: Chat history cleared client-side
  return Response.json({ deleted: true }, { status: 200 });
}
