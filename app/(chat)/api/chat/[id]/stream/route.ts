// Stateless: Resumable streams removed
// In stateless mode, clients manage their own stream state
// This endpoint is kept for compatibility but returns empty response
export function GET() {
  return new Response(null, { status: 204 });
}
