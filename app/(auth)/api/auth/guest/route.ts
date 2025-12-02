import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { signIn } from "@/app/(auth)/auth"
import { isDevelopmentEnvironment } from "@/lib/constants"

export async function GET(request: Request) {
  console.log("[auth/guest] GET: Starting guest auth request")
  console.log("[auth/guest] GET: Request URL:", request.url)
  console.log("[auth/guest] GET: Headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2))

  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get("redirectUrl") || "/"
  console.log("[auth/guest] GET: Redirect URL:", redirectUrl)

  console.log("[auth/guest] GET: Checking existing token")
  console.log("[auth/guest] GET: isDevelopmentEnvironment:", isDevelopmentEnvironment)
  console.log("[auth/guest] GET: secureCookie:", !isDevelopmentEnvironment)

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  })

  console.log("[auth/guest] GET: Token result:", token ? JSON.stringify(token, null, 2) : "null")

  if (token) {
    console.log("[auth/guest] GET: User already logged in, redirecting to home")
    return NextResponse.redirect(new URL("/", request.url))
  }

  console.log("[auth/guest] GET: No existing token, calling signIn with guest provider")
  console.log("[auth/guest] GET: signIn params:", JSON.stringify({ redirect: true, redirectTo: redirectUrl }))

  const response = await signIn("guest", { redirect: true, redirectTo: redirectUrl })

  console.log("[auth/guest] GET: signIn response type:", typeof response)
  console.log("[auth/guest] GET: signIn response:", response)

  if (response instanceof Response) {
    console.log("[auth/guest] GET: Response status:", response.status)
    console.log(
      "[auth/guest] GET: Response headers:",
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2),
    )
  }

  console.log("[auth/guest] GET: Returning response")
  return response
}
