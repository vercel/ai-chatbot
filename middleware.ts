import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default async function middleware(req: any) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  // Prefer branch URL for stable preview domains, then fall back to deployment URL.
  const host =
    process.env.VERCEL_BRANCH_URL ??
    req.headers.get('x-forwarded-host') ??
    process.env.VERCEL_URL ??
    req.nextUrl.host;

  const redirectUri = `${proto}://${host}/callback`;

  return authkitMiddleware({
    redirectUri,
    middlewareAuth: {
      enabled: true,
      unauthenticatedPaths: [
        '/login',
        '/register',
        '/callback',
        '/ping',
        '/.well-known/oauth-protected-resource',
        '/.well-known/oauth-authorization-server',
        '/api/mcp',
      ],
    },
    debug: true,
  });
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
