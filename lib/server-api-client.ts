/**
 * Server-side API client for Next.js server components.
 * Handles authentication for server-side requests to FastAPI backend.
 * Now uses cookie-based authentication (auth_token cookie).
 */

import { cookies } from "next/headers";
import { getApiUrl } from "./api-client";

/**
 * Server-side fetch function for API requests.
 * Handles authentication automatically.
 * Forwards all auth cookies to FastAPI backend so it can restore users if JWT expires.
 */
export async function serverApiFetch(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  let url = getApiUrl(endpoint);

  // Ensure we have an absolute URL for server-side fetch
  // If getApiUrl returns a relative URL, construct absolute URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    // For server-side, we need to determine the base URL
    // Check if endpoint should go to FastAPI
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

    // Auth endpoints always go to FastAPI
    if (endpoint.startsWith("/api/auth/")) {
      url = `${API_URL}${endpoint}`;
    } else {
      // For other endpoints, try to construct absolute URL
      // In server-side, relative URLs don't work with fetch()
      // Default to FastAPI if we can't determine
      url = `${API_URL}${endpoint}`;
    }
  }

  const headers = new Headers(init?.headers);

  // Get cookies to forward to FastAPI
  // FastAPI needs these cookies to restore users if JWT expired
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const guestSessionId = cookieStore.get("guest_session_id")?.value;
  const userSessionId = cookieStore.get("user_session_id")?.value;

  // Build cookie header with all session cookies
  // Backend will use session IDs to restore users if JWT expired or key is lost
  const cookieHeader = [
    token && `auth_token=${token}`,
    guestSessionId && `guest_session_id=${guestSessionId}`,
    userSessionId && `user_session_id=${userSessionId}`,
  ]
    .filter(Boolean)
    .join("; ");

  // Forward cookies to FastAPI (allows backend to restore user if JWT expired)
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }
  // Also send token as Authorization header (for backward compatibility)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is set for FastAPI (but not for FormData)
  if (
    !headers.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  return response;
}
