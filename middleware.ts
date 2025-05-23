import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/debug(.*)',
  '/api/n8n-callback',
  '/api/chat/*/messages',
]);

export default clerkMiddleware(async (auth, req) => {
  console.log(`[Middleware] Processing route: ${req.nextUrl.pathname}`);

  // If it's NOT a public route, protect it
  if (!isPublicRoute(req)) {
    try {
      await auth.protect();
      console.log(`[Middleware] Protected route: ${req.nextUrl.pathname}`);
    } catch (error) {
      console.log(
        `[Middleware] Unauthorized access to ${req.nextUrl.pathname}, redirecting to sign-in`,
      );
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  } else {
    console.log(`[Middleware] Public route: ${req.nextUrl.pathname}`);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
