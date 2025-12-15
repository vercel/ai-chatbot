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

    // Create response
    const nextResponse = NextResponse.json({ success: true });

    // Delete cookies by setting them with Expires in the past
    // Note: Set-Cookie headers from FastAPI are not accessible via fetch() in Node.js
    // So we manually delete cookies by setting them with Expires in the past
    const pastDate = new Date(0).toUTCString();
    const isProduction = process.env.NODE_ENV === "production";

    // Delete auth_token cookie
    nextResponse.headers.set(
      "Set-Cookie",
      `auth_token=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );

    // Delete guest_session_id cookie
    nextResponse.headers.append(
      "Set-Cookie",
      `guest_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );

    // Delete user_session_id cookie
    nextResponse.headers.append(
      "Set-Cookie",
      `user_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );

    // Also delete cookies in Next.js cookie store (server-side)
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("guest_session_id");
    cookieStore.delete("user_session_id");

    return nextResponse;
  } catch (error) {
    console.error("Error during logout:", error);
    // Even on error, try to clear cookies
    const nextResponse = NextResponse.json({ success: true }, { status: 200 });

    // Explicitly delete cookies by setting them with Expires in the past
    const pastDate = new Date(0).toUTCString();
    const isProduction = process.env.NODE_ENV === "production";

    nextResponse.headers.set(
      "Set-Cookie",
      `auth_token=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );
    nextResponse.headers.append(
      "Set-Cookie",
      `guest_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );
    nextResponse.headers.append(
      "Set-Cookie",
      `user_session_id=; Path=/; Expires=${pastDate}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`
    );

    // Also delete cookies in Next.js cookie store (server-side)
    try {
      const cookieStore = await cookies();
      cookieStore.delete("auth_token");
      cookieStore.delete("guest_session_id");
      cookieStore.delete("user_session_id");
    } catch {
      // Ignore errors when deleting cookies
    }

    return nextResponse;
  }
}
