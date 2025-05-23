import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/debug(.*)',
  '/api/n8n-callback',
  '/api/(chat)/messages(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const requestedPath = req.nextUrl.pathname;
  const requestedUrl = req.url;
  console.log(
    `[Middleware] Request IN: Path=${requestedPath}, FullURL=${requestedUrl}`,
  );

  const isPublic = isPublicRoute(req);

  console.log(
    `[Middleware] Path=${requestedPath}, isPublicRoute evaluated to: ${isPublic}`,
  );

  // If it's NOT a public route, protect it
  if (!isPublic) {
    try {
      await auth.protect();
      console.log(
        `[Middleware] Protected route: Path=${requestedPath}, FullURL=${requestedUrl}`,
      );
    } catch (error) {
      console.log(
        `[Middleware] Unauthorized access to Path=${requestedPath}, FullURL=${requestedUrl}, redirecting to sign-in`,
      );
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  } else {
    console.log(
      `[Middleware] Allowing public access to Path=${requestedPath}, FullURL=${requestedUrl}`,
    );
  }
  // If public or successfully protected, allow the request to proceed.
  // For public routes, NextResponse.next() is implicitly handled if no other response is returned.
  // For protected routes, if auth.protect() doesn't throw/redirect, the request also proceeds.

  console.log('[Middleware] Path:', requestedPath);
  console.log('[Middleware] Full URL:', requestedUrl);
  console.log(
    '[Middleware] Forcing redeploy attempt with new log - 2024-05-23-v2',
  );
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
