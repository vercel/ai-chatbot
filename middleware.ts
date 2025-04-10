import { auth } from './app/(auth)/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { anonymousRegex } from './lib/constants';

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

  const isLoggedIn = session.user;
  const isAnonymousUser = anonymousRegex.test(session.user?.email ?? '');

  const isOnLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isOnRegisterPage = request.nextUrl.pathname.startsWith('/register');

  // If the user is logged in and not an anonymous user, redirect to the home page
  if (isLoggedIn && !isAnonymousUser && (isOnLoginPage || isOnRegisterPage)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Otherwise, continue handling the request.
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
