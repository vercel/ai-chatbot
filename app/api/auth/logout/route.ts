import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Server-side logout route handler.
 * Calls FastAPI logout endpoint, clears cookies, and redirects to login.
 * This ensures cookies are properly cleared before navigation.
 */
export async function POST(request: NextRequest) {
  try {
    // Call FastAPI logout endpoint
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/logout`;

    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Failed to logout:", response.status, response.statusText);
      // Even if FastAPI fails, clear cookies locally
    }

    // Clear cookies in Next.js response (server-side)
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("guest_session_id");
    cookieStore.delete("user_session_id");

    // Forward Set-Cookie headers from FastAPI to ensure cookies are deleted
    // FastAPI sets delete cookies via Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length === 0) {
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookies) {
          // Extract cookie name and create delete cookie
          const cookieName = cookie.split("=")[0];
          cookieStore.delete(cookieName);
        }
      }
    } else {
      // Process Set-Cookie headers from FastAPI
      for (const cookie of setCookieHeaders) {
        // FastAPI delete cookies have format: "auth_token=; Path=/; Expires=..."
        // We need to extract the cookie name
        const cookieName = cookie.split("=")[0];
        cookieStore.delete(cookieName);
      }
    }

    // Return success response - client will handle redirect
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during logout:", error);
    // Even on error, try to clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("guest_session_id");
    cookieStore.delete("user_session_id");

    return NextResponse.json({ success: true }, { status: 200 });
  }
}
