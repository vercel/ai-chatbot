// This file is deprecated.
// The new implementation is at /app/api/knowledgeupload/route.ts
// This route was encountering 405 Method Not Allowed errors, likely due to 
// conflicts with the base /api/knowledge route.

export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/api/knowledgeupload'
    }
  });
}
