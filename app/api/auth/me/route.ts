import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Proxy endpoint for /api/auth/me
 * Forwards requests to FastAPI backend and returns user info
 */
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const guestSessionId = cookieStore.get("guest_session_id")?.value;
    const userSessionId = cookieStore.get("user_session_id")?.value;

    // Build cookie header with all session cookies
    const cookieHeader = [
      token && `auth_token=${token}`,
      guestSessionId && `guest_session_id=${guestSessionId}`,
      userSessionId && `user_session_id=${userSessionId}`,
    ]
      .filter(Boolean)
      .join("; ");

    // If no cookies at all, return 401
    if (!cookieHeader) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // Call FastAPI backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    const fastApiUrl = `${API_URL}/api/auth/me`;

    // Build headers
    const headers: HeadersInit = {
      Cookie: cookieHeader,
      // Also send as Authorization header
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(fastApiUrl, {
      headers,
      credentials: "include",
      cache: "no-store",
    });

    // Get response data
    const data = await response.json();

    // Create Next.js response
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward Set-Cookie headers from FastAPI to client
    // This allows the backend to refresh tokens or set new cookies
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length === 0) {
      // Fallback: try to get Set-Cookie header manually
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : setCookieHeader.split(", ");
        for (const cookie of cookies) {
          nextResponse.headers.append("Set-Cookie", cookie.trim());
        }
      }
    } else {
      for (const cookie of setCookieHeaders) {
        nextResponse.headers.append("Set-Cookie", cookie);
      }
    }

    return nextResponse;
  } catch (error) {
    console.error("Error proxying /api/auth/me:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
