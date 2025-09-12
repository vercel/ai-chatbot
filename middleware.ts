import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// Prefer explicit redirect URI; fall back to preview deployment URL
const fallbackHost =
  process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || 'localhost:3000';

const fallbackProto = fallbackHost.includes('localhost') ? 'http' : 'https';
const computedRedirectUri = `${fallbackProto}://${fallbackHost}/callback`;
const REDIRECT_URI =
  process.env.WORKOS_REDIRECT_URI ||
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
  computedRedirectUri;

export default authkitMiddleware({
  redirectUri: REDIRECT_URI,
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
