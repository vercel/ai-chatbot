import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// Set WORKOS_REDIRECT_URI environment variable dynamically for preview deployments
const setupRedirectUri = () => {
  if (!process.env.WORKOS_REDIRECT_URI) {
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host =
      process.env.VERCEL_BRANCH_URL ||
      process.env.VERCEL_URL ||
      'localhost:3000';
    process.env.WORKOS_REDIRECT_URI = `${proto}://${host}/callback`;
  }
};

// Setup redirect URI before configuring middleware
setupRedirectUri();

export default authkitMiddleware({
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
