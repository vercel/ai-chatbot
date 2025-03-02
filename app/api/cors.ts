import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Default CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

/**
 * CORS middleware for API routes
 * This function should be called at the beginning of API route handlers
 * 
 * @param request The incoming request
 * @returns A response for OPTIONS requests or null to continue processing
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { 
      status: 204,
      headers: CORS_HEADERS 
    });
  }
  
  // For other methods, continue with request handling
  return null;
}

/**
 * Add CORS headers to a response
 * Use this when returning a response from an API route
 * 
 * @param response The response to add headers to
 * @returns The modified response with CORS headers
 */
export function withCorsHeaders<T extends Response | NextResponse>(response: T): T {
  // Add each CORS header to the response
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}