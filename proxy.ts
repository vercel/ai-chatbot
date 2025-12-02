import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`Proxy handling request for path: ${pathname}`);

  return new Response()
  
  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    const response = new Response("pong", { status: 200 });
    console.log("Ping endpoint hit, returning 200");
    return response;
  }

  if (pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    console.log("Auth endpoint hit, proceeding without checks");
    return response;
  }

  console.log("Fetching token...");
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    console.log("No token found.");
    const redirectUrl = encodeURIComponent(request.url);

    const response = NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
    console.log("Redirecting to guest auth");
    return response;
  }

  console.log("Token found:", token);
  const isGuest = guestRegex.test(token?.email ?? "");
  console.log("Is guest user:", isGuest);

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    const response = NextResponse.redirect(new URL("/", request.url));
    console.log("User logged in and not guest, redirecting to home");
    return response;
  }

  const response = NextResponse.next();
  console.log("Token valid, proceeding");
  return response;
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
