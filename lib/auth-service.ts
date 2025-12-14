/**
 * Server-side authentication service for FastAPI backend.
 * Replaces NextAuth with direct FastAPI authentication.
 *
 * NOTE: This file uses server-only APIs (cookies from next/headers).
 * For client components, use lib/auth-service-client.ts instead.
 */

import { cookies } from "next/headers";
import { getApiUrl } from "./api-client";
import { serverApiFetch } from "./server-api-client";

// Re-export types for convenience (these are safe to use in client components)
export type { UserType, User } from "./auth-service-client";

// Import types for internal use
import type { User, UserType } from "./auth-service-client";

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

/**
 * Get the current authenticated user.
 * Reads JWT token from httpOnly cookie and decodes it, or calls FastAPI /api/auth/me
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // For server-side: Read cookies and call FastAPI to get user info
    // Note: cookies() cannot be called during static generation/prerendering
    // If it fails, we return null (user will be handled client-side)
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (error) {
      // During prerendering, cookies() rejects - this is expected
      // Return null and let client-side handle authentication
      if (
        error instanceof Error &&
        error.message.includes("prerender") &&
        error.message.includes("cookies()")
      ) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }

    const token = cookieStore.get("auth_token")?.value;
    const guestSessionId = cookieStore.get("guest_session_id")?.value;
    const userSessionId = cookieStore.get("user_session_id")?.value;

    // If no cookies at all, return null
    if (!token && !guestSessionId && !userSessionId) {
      return null;
    }

    // Use Next.js proxy route which forwards Set-Cookie headers to the client
    // This is important because when FastAPI restores a user from guest_session_id,
    // it issues new JWT tokens via Set-Cookie headers that need to reach the browser
    //
    // Note: In Server Components, we need to construct an absolute URL for fetch()
    // The proxy route will forward cookies to FastAPI and Set-Cookie headers back to client
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const url = `${baseUrl}/api/auth/me`;

    // Call Next.js proxy which forwards cookies to FastAPI and Set-Cookie headers back to client
    // The proxy at app/api/auth/me/route.ts handles cookie forwarding properly
    // Cookies are automatically included from the request (via cookieStore in the proxy)
    const response = await fetch(url, {
      credentials: "include",
      // Server-side fetch needs cache control
      cache: "no-store",
      // Include cookies in the request
      headers: {
        Cookie: [
          token && `auth_token=${token}`,
          guestSessionId && `guest_session_id=${guestSessionId}`,
          userSessionId && `user_session_id=${userSessionId}`,
        ]
          .filter(Boolean)
          .join("; "),
      },
    });

    if (!response.ok) {
      // Log error for debugging
      if (response.status !== 401) {
        console.error(
          "Error getting current user:",
          response.status,
          response.statusText
        );
      }
      return null;
    }

    const user = await response.json();
    return user as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Login with email and password (server-side).
 * Returns user data and sets httpOnly cookie.
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await serverApiFetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Login failed",
    }));
    throw new Error(error.detail || "Login failed");
  }

  const data = (await response.json()) as AuthResponse;

  // Set cookies in Next.js response (server-side)
  // Note: user_session_id is set by the backend via Set-Cookie headers
  // We need to forward those headers from the backend response
  // For now, we only set auth_token here - user_session_id should come from backend
  const cookieStore = await cookies();
  cookieStore.set("auth_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  // Note: user_session_id cookie is set by FastAPI backend via Set-Cookie header
  // We should NOT set it here with raw UUID - it must be HMAC-signed token from backend
  // The backend's Set-Cookie headers need to be forwarded to the browser
  // This is a limitation of Server Actions - they can't forward Set-Cookie headers
  // TODO: Consider using route handlers (like /api/auth/guest) that can forward Set-Cookie headers

  return data;
}

/**
 * Register a new user (server-side).
 * Returns user data and sets httpOnly cookie.
 */
export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await serverApiFetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = "Registration failed";
    try {
      const error = await response.json();
      // FastAPI returns {detail: "..."} format
      errorMessage = error.detail || error.message || errorMessage;
      console.error("Registration error:", error);
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as AuthResponse;

  // Set cookies in Next.js response (server-side)
  // Note: user_session_id is set by the backend via Set-Cookie headers
  // We need to forward those headers from the backend response
  // For now, we only set auth_token here - user_session_id should come from backend
  const cookieStore = await cookies();
  cookieStore.set("auth_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  // Note: user_session_id cookie is set by FastAPI backend via Set-Cookie header
  // We should NOT set it here with raw UUID - it must be HMAC-signed token from backend
  // The backend's Set-Cookie headers need to be forwarded to the browser
  // This is a limitation of Server Actions - they can't forward Set-Cookie headers
  // TODO: Consider using route handlers (like /api/auth/guest) that can forward Set-Cookie headers

  return data;
}

/**
 * Create a guest user (server-side).
 * NOTE: This function does NOT set cookies (cookies can only be set in Route Handlers).
 * For Server Components, use the /api/auth/guest route handler instead.
 * This function is kept for backward compatibility but should not be used in Server Components.
 */
export async function createGuest(): Promise<AuthResponse> {
  const response = await serverApiFetch("/api/auth/guest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Guest creation failed",
    }));
    throw new Error(error.detail || "Guest creation failed");
  }

  const data = (await response.json()) as AuthResponse;

  // NOTE: Cannot set cookies in Server Components
  // Cookies are set by FastAPI backend via Set-Cookie headers
  // For Server Components, use the Route Handler at /api/auth/guest instead

  return data;
}

/**
 * Logout user by clearing auth cookies (server-side).
 * Clears auth_token, guest_session_id, and user_session_id cookies.
 */
export async function logout(): Promise<void> {
  await serverApiFetch("/api/auth/logout", {
    method: "POST",
  });

  // Clear cookies in Next.js response (server-side)
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("guest_session_id");
  cookieStore.delete("user_session_id");
}

/**
 * Request a password reset (server-side).
 * Works even if JWT tokens are invalid (for recovery scenarios).
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
  reset_token?: string; // Only in development
}> {
  const response = await serverApiFetch("/api/auth/password-reset/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Password reset request failed",
    }));
    throw new Error(error.detail || "Password reset request failed");
  }

  return (await response.json()) as {
    success: boolean;
    message: string;
    reset_token?: string;
  };
}

/**
 * Confirm password reset with token (server-side).
 * Works even if JWT tokens are invalid (for recovery scenarios).
 * Returns new JWT token and sets cookies.
 */
export async function confirmPasswordReset(
  email: string,
  password: string,
  resetToken: string
): Promise<AuthResponse> {
  const response = await serverApiFetch("/api/auth/password-reset/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, reset_token: resetToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Password reset failed",
    }));
    throw new Error(error.detail || "Password reset failed");
  }

  const data = (await response.json()) as AuthResponse;

  // Set cookies in Next.js response (server-side)
  // Note: user_session_id is set by the backend via Set-Cookie headers
  // We need to forward those headers from the backend response
  // For now, we only set auth_token here - user_session_id should come from backend
  const cookieStore = await cookies();
  cookieStore.set("auth_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  // Note: user_session_id cookie is set by FastAPI backend via Set-Cookie header
  // We should NOT set it here with raw UUID - it must be HMAC-signed token from backend
  // The backend's Set-Cookie headers need to be forwarded to the browser
  // This is a limitation of Server Actions - they can't forward Set-Cookie headers
  // TODO: Consider using route handlers (like /api/auth/guest) that can forward Set-Cookie headers

  return data;
}
