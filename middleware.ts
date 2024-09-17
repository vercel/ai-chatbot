import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { HttpMethod, Route, RouteLogOutput, Timestamp, UUID } from './lib/types';

export async function middleware(request: NextRequest) {
  const start: Timestamp = `${Date.now()}`;
  
  // Explicitly assert the type of uuidv4() to match UUID
  const requestId: UUID = uuidv4() as UUID;
  
  const method = request.method as HttpMethod;
  const pathname = request.nextUrl.pathname as Route;
  
  // Create a NextResponse object to attach headers
  const response = NextResponse.next();
  
  // Attach CORS headers to allow cross-origin requests
  response.headers.set('Access-Control-Allow-Origin', '*'); // Adjust origin as needed
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow these HTTP methods
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow these headers
  
  // Handle preflight OPTIONS request
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  // Attach the start time and request ID to the request headers
  response.headers.set('x-start-time', start);
  response.headers.set('x-request-id', requestId);

  const routeLog: RouteLogOutput = `${requestId} | ${start} | ${method} | ${pathname}`;
  console.log(routeLog);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|__nextjs_original-stack-frame).*)'
  ]
}