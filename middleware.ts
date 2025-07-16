import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { authkit } from '@workos-inc/authkit-nextjs';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use AuthKit for /authkit-test only
  if (pathname.startsWith('/authkit-test')) {
    const { session, headers, authorizationUrl } = await authkit(request, {
      debug: true,
    });
    if (!session.user) {
      // Fallback to '/' if authorizationUrl is undefined
      return NextResponse.redirect(authorizationUrl ?? '/');
    }
    return NextResponse.next({ headers });
  }

  // Existing NextAuth/guest logic for all other routes
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/authkit-test',
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
