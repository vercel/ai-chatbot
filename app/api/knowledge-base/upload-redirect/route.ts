import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Redirect all requests to the new knowledge create endpoint
export async function POST(req: NextRequest) {
  console.log('[REDIRECT] Redirecting from old /api/knowledge-base/upload to /api/knowledge/create');
  
  // Get the request body as a blob to forward it
  const body = await req.blob();
  
  // Forward the request to the new endpoint
  const response = await fetch(new URL('/api/knowledge/create', req.url), {
    method: 'POST',
    body,
    headers: req.headers,
  });
  
  // Forward the response back
  return response;
}