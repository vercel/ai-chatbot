import { NextResponse, type NextRequest } from 'next/server';
import { authkit } from '@workos-inc/authkit-nextjs';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run the authkit helper on all requests.
  const { session, headers, authorizationUrl } = await authkit(request, {
    debug: true,
  });

  // If the user is logged in, redirect them from login/register pages
  // to the home page.
  if (session?.user && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Define public paths.
  const publicPaths = [
    '/login',
    '/register',
    '/callback',
    '/ping',
    '/authkit-test',
  ];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If the user is not logged in and the path is not public,
  // redirect them to the login page.
  if (!session?.user && !isPublicPath) {
    return NextResponse.redirect(
      authorizationUrl ?? new URL('/login', request.url),
    );
  }

  // If the user is logged in or the path is public, continue.
  // We pass the headers from authkit so the session is available in
  // server components and API routes.
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
