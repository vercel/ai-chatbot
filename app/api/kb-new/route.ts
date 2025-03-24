// This file is deprecated.
// The new implementation is at /app/api/knowledgeupload/route.ts
// This route was encountering 404 errors, possibly due to Next.js routing conflicts.

export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/api/knowledgeupload'
    }
  });
}
