import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';

// Add middleware logging
const middlewareWithLogging = async (request: Request, event: { waitUntil: Function }) => {
  console.log(`[Middleware] Processing request to: ${request.nextUrl.pathname}`);
  console.log(`[Middleware] Request method: ${request.method}`);
  console.log(`[Middleware] Full URL: ${request.nextUrl.toString()}`);
  
  try {
    const response = await NextAuth(authConfig).auth(request, event);
    
    // If response is a redirect or a rejection
    if (response instanceof NextResponse) {
      console.log(`[Middleware] Redirecting or rejecting request to: ${request.nextUrl.pathname}`);
      console.log(`[Middleware] Response status: ${response.status}`);
      return response;
    }
    
    console.log(`[Middleware] Auth successful for: ${request.nextUrl.pathname}`);
    return response;
  } catch (error) {
    console.error(`[Middleware] Error processing ${request.nextUrl.pathname}:`, error);
    return NextResponse.next();
  }
};

export default middlewareWithLogging;

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
