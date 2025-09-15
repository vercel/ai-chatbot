import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/',
  '/chat/:id',
  '/api/:path*',
]);

export default clerkMiddleware(async (auth, req) => {
  // Debug logging for authentication setup
  console.log('Middleware: Processing request for', req.nextUrl.pathname);
  console.log('Middleware: Clerk publishable key present:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  console.log('Middleware: Clerk secret key present:', !!process.env.CLERK_SECRET_KEY);
  console.log('Middleware: AUTH_SECRET present:', !!process.env.AUTH_SECRET);

  // Handle ping route for Playwright tests
  if (req.nextUrl.pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    console.log('Middleware: Protecting route', req.nextUrl.pathname);
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
