import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// Compute redirect URI for preview deployments
const host =
  process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || 'localhost:3000';

const proto = host.includes('localhost') ? 'http' : 'https';
const REDIRECT_URI = `${proto}://${host}/callback`;

export default authkitMiddleware({
  redirectUri: REDIRECT_URI, // overrides any WORKOS_REDIRECT_URI env var
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
