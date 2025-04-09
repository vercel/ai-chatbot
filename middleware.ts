import NextAuth from 'next-auth';
import { auth } from './app/(auth)/auth';
import { authConfig } from './app/(auth)/auth.config';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip the check for the guest auth endpoint to avoid infinite loops.
  if (request.nextUrl.pathname.startsWith('/api/auth/guest')) {
    return NextResponse.next();
  }

  const session = await auth();

  // If no session exists, rewrite the URL to the guest endpoint.
  if (!session) {
    return NextResponse.redirect(new URL('/api/auth/guest', request.url));
  }

  // Otherwise, continue handling the request.
  return NextResponse.next();
}

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
