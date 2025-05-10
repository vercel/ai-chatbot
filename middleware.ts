import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

// Public routes that are always accessible
const publicRoutes = ['/login', '/register', '/api/auth', '/ping'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware processing: ${pathname}`);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Allow authentication endpoints
  if (pathname.startsWith('/api/auth')) {
    console.log(`Allowing auth endpoint: ${pathname}`);
    return NextResponse.next();
  }

  // Always allow access to login and register pages
  if (pathname === '/login' || pathname === '/register') {
    console.log(`Allowing public page: ${pathname}`);
    return NextResponse.next();
  }

  // Get authentication token
  console.log('Retrieving authentication token');
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie:
      process.env.NODE_ENV === 'production' &&
      !process.env.NEXTAUTH_URL?.startsWith('http://localhost'),
  });
  console.log(
    `Token found: ${!!token}, token email: ${token?.email || 'none'}`,
  );

  // Read guest access setting from cookie
  // Default to true if cookie is not set
  const guestAccessCookie = request.cookies.get('allowGuestAccess');
  const allowGuestAccess = guestAccessCookie
    ? guestAccessCookie.value === 'true'
    : true;
  console.log(
    `Guest access setting: ${allowGuestAccess ? 'allowed' : 'not allowed'}`,
  );

  // If user is not authenticated
  if (!token) {
    console.log('No authentication token found');
    // If guest access is not allowed, redirect to login
    if (!allowGuestAccess) {
      console.log('Guest access not allowed, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If guest access is allowed, create a guest user session
    console.log('Creating guest session');
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const isGuest = guestRegex.test(token?.email ?? '');
  console.log(`User is guest: ${isGuest}`);

  // If guest access is disabled and current user is a guest, redirect to login
  if (isGuest && !allowGuestAccess) {
    console.log('Guest access disabled for guest user, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/register pages
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    console.log(
      'Authenticated user trying to access login/register, redirecting to home',
    );
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('Middleware allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/api/:path*',
    '/login',
    '/register',
    '/profile/:path*',
    '/admin/:path*',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
