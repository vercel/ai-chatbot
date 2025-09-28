import { headers } from "next/headers";
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createGuestUser } from "@/lib/db/queries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectUrl = searchParams.get("redirectUrl") || "/"

  try {
    // Check if already authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Create guest user
    const [guestUser] = await createGuestUser()

    // Sign in the guest user programmatically
    // This approach manually creates a session for the guest user
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: guestUser.email!,
        password: "guest-password", // Use a consistent guest password
      },
      asResponse: true
    })

    if (signInResponse.ok) {
      // Forward the session cookies from the sign-in response
      const response = NextResponse.redirect(new URL(redirectUrl, request.url))

      // Copy auth cookies from the sign-in response
      const authCookies = signInResponse.headers.get('set-cookie')
      if (authCookies) {
        response.headers.set('set-cookie', authCookies)
      }

      return response
    }

    throw new Error('Guest sign-in failed')
  } catch (error) {
    console.error('Guest authentication error:', error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
