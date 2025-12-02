import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`[proxy] Headers:`, Object.fromEntries(request.headers.entries()))

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    console.log("[proxy] Ping endpoint hit, returning 200")
    const response = new Response("pong", { status: 200 })
    console.log("[proxy] ========== Proxy Request End (ping) ==========")
    return response
  }

  if (pathname.startsWith("/api/auth")) {
    console.log("[proxy] Auth endpoint hit, proceeding without checks")
    const response = NextResponse.next()
    console.log("[proxy] ========== Proxy Request End (auth) ==========")
    return response
  }

  console.log("[proxy] Fetching token...")
  console.log(`[proxy] Using secure cookie: ${!isDevelopmentEnvironment}`)

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  })

  if (!token) {
    console.log("[proxy] No token found - user is unauthenticated")
    const redirectUrl = encodeURIComponent(request.url)
    const guestAuthUrl = `/api/auth/guest?redirectUrl=${redirectUrl}`
    console.log(`[proxy] Redirecting to guest auth: ${guestAuthUrl}`)

    const response = NextResponse.redirect(new URL(guestAuthUrl, request.url))
    console.log("[proxy] ========== Proxy Request End (no token) ==========")
    return response
  }

  console.log("[proxy] Token found:")
  console.log(`[proxy]   - Email: ${token?.email}`)
  console.log(`[proxy]   - Sub: ${token?.sub}`)
  console.log(`[proxy]   - Exp: ${token?.exp}`)

  const isGuest = guestRegex.test(token?.email ?? "")
  console.log(`[proxy] Is guest user: ${isGuest}`)
  console.log(`[proxy] Guest regex pattern: ${guestRegex}`)

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    console.log("[proxy] Authenticated non-guest user trying to access login/register")
    console.log("[proxy] Redirecting to home page")
    const response = NextResponse.redirect(new URL("/", request.url))
    console.log("[proxy] ========== Proxy Request End (redirect home) ==========")
    return response
  }

  console.log("[proxy] Token valid, proceeding to next middleware/route")
  const response = NextResponse.next()
  console.log("[proxy] ========== Proxy Request End (success) ==========")
  return response
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
}
