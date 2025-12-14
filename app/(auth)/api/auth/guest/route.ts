import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // Check if user is already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const guestSessionId = cookieStore.get("guest_session_id")?.value;
  const userSessionId = cookieStore.get("user_session_id")?.value;

  if (token || guestSessionId || userSessionId) {
    // User already has auth cookies, redirect
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Create guest user by calling FastAPI directly
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/guest`;

    // Call FastAPI to create guest user
    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to create guest user:", response.status, response.statusText);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Get the user data from response
    const data = await response.json();

    // Create redirect response
    const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Forward Set-Cookie headers from FastAPI to client
    // FastAPI sets cookies via Set-Cookie headers in the response
    // Note: getSetCookie() is available in Node.js 18+ fetch API
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    // If getSetCookie is not available, try to get Set-Cookie header manually
    if (setCookieHeaders.length === 0) {
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        // Handle multiple Set-Cookie headers (they might be comma-separated or in an array)
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookies) {
          redirectResponse.headers.append("Set-Cookie", cookie.trim());
        }
      }
    } else {
      for (const cookie of setCookieHeaders) {
        redirectResponse.headers.append("Set-Cookie", cookie);
      }
    }

    return redirectResponse;
  } catch (error) {
    console.error("Error creating guest user:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
