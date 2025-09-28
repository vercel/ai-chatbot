import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { guestRegex } from "./lib/constants"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 })
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      const redirectUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
      )
    }

    const isGuest = guestRegex.test(session.user?.email ?? "")

    if (session && !isGuest && ["/login", "/register"].includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    // Handle specific auth-related errors
    if (error instanceof Error) {
      // For token validation errors, redirect to guest auth
      if (error.message.includes("token") || error.message.includes("jwt") || error.message.includes("session")) {
        const redirectUrl = encodeURIComponent(request.url)
        return NextResponse.redirect(
          new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
        )
      }

      // For network/database errors, return error response instead of redirecting
      if (error.message.includes("network") || error.message.includes("database") || error.message.includes("connection")) {
        return new Response("Service temporarily unavailable", { status: 503 })
      }
    }

    // For unknown errors, redirect to guest auth as fallback
    const redirectUrl = encodeURIComponent(request.url)
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    )
  }
}

export const config = {
  runtime: "nodejs", // Required for BetterAuth session handling
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
