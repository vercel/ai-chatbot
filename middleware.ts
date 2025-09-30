import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if user is already authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET || "development-secret-key-change-in-production"
  });
  
  if (token) {
    // User is authenticated, allow the request to proceed
    return NextResponse.next();
  }

  const redirectUrl = encodeURIComponent(request.url);

  // User is not authenticated, redirect to guest login
  return NextResponse.redirect(
    new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
  );
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
