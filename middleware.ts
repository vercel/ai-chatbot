import { NextResponse, type NextRequest } from 'next/server';

import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = getSessionCookie(request);

  if (!token) {
    if (pathname === '/chat') {
      return NextResponse.next();
    }

    const redirectUrl = encodeURIComponent(request.url);

    if (pathname.startsWith('/chat/') || pathname === '/') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }

    return NextResponse.redirect(
      new URL(`/chat?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  return NextResponse.next();
}

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
