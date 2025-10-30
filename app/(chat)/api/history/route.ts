// Stateless: Chat history managed client-side
// Returns empty array for compatibility
export async function GET() {
  return Response.json({ results: [], hasMore: false });
}

export async function DELETE() {
  // Stateless: Chat history cleared client-side
  return Response.json({ deleted: true }, { status: 200 });
}
