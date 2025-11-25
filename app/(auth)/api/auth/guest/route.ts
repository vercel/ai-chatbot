import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { signIn } from "@/app/(auth)/auth"
import { isDevelopmentEnvironment } from "@/lib/constants"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get("redirectUrl") || "/"

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  })

  if (token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    console.log("[v0] Starting guest sign in...")
    return signIn("guest", { redirect: true, redirectTo: redirectUrl })
  } catch (error) {
    console.error("[v0] Guest sign in failed:", error)
    // Return error page instead of redirecting to prevent loop
    return new NextResponse("Authentication failed. Please try again.", { status: 500 })
  }
}
