/**
 * Server-side API client for Next.js server components.
 * Handles authentication for server-side requests to FastAPI backend.
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import { getApiUrl } from "./api-client";
import { isAuthDisabled } from "./constants";

/**
 * Get JWT token for server-side FastAPI requests.
 * Uses NextAuth session to generate JWT token.
 */
async function getServerAuthToken(): Promise<string | null> {
  if (isAuthDisabled) {
    return null;
  }

  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (!jwtSecret) {
    console.error("JWT_SECRET_KEY is not set in environment variables");
    return null;
  }

  // Generate JWT token matching FastAPI format
  const token = jwt.sign(
    {
      sub: session.user.id,
      type: session.user.type || "regular",
    },
    jwtSecret,
    {
      expiresIn: "30m",
      algorithm: "HS256",
    }
  );

  return token;
}

/**
 * Get session ID from cookies (for when auth is disabled)
 */
async function getServerSessionId(): Promise<string | null> {
  if (!isAuthDisabled) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  return sessionId || null;
}

/**
 * Server-side fetch function for API requests.
 * Handles authentication automatically.
 */
export async function serverApiFetch(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  const url = getApiUrl(endpoint);
  const headers = new Headers(init?.headers);

  // Add authentication
  if (isAuthDisabled) {
    const sessionId = await getServerSessionId();
    if (sessionId) {
      headers.set("X-Session-Id", sessionId);
    }
  } else {
    const token = await getServerAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
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
