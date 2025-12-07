/**
 * API Client that routes requests to either Next.js API routes or FastAPI backend
 * based on environment configuration.
 *
 * Usage:
 * - Set NEXT_PUBLIC_API_URL=http://localhost:8000
 * - Set NEXT_PUBLIC_USE_FASTAPI_BACKEND=true to enable FastAPI routing
 * - Or set NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat,history,vote to selectively route specific endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const USE_FASTAPI = process.env.NEXT_PUBLIC_USE_FASTAPI_BACKEND === "true";
const FASTAPI_ENDPOINTS =
  process.env.NEXT_PUBLIC_FASTAPI_ENDPOINTS?.split(",") || [];

/**
 * Extract the endpoint path from a URL (handles both relative and absolute URLs)
 */
function extractEndpointPath(url: string): string {
  try {
    // If it's already a full URL, extract the path
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const urlObj = new URL(url);
      return urlObj.pathname;
    }
    // If it's a relative URL, extract just the path (before query string)
    const pathname = url.split("?")[0].split("#")[0];
    return pathname;
  } catch {
    // If URL parsing fails, return the original string
    return url;
  }
}

/**
 * Check if an endpoint should be routed to FastAPI backend
 */
function shouldUseFastAPI(endpoint: string): boolean {
  if (!USE_FASTAPI && FASTAPI_ENDPOINTS.length === 0) {
    return false;
  }

  // Extract the path from the URL (handles both relative and absolute URLs)
  const path = extractEndpointPath(endpoint);

  // Stream resumption endpoints are now in FastAPI backend
  // Pattern: /api/chat/{id}/stream - allow these to go to FastAPI

  // If specific endpoints are configured, check if this endpoint matches
  if (FASTAPI_ENDPOINTS.length > 0) {
    return FASTAPI_ENDPOINTS.some((ep) => {
      // Match exact endpoint or endpoint with query params
      // e.g., /api/chat or /api/chat?id=... but not /api/chat/{id}/stream
      const pattern = `/api/${ep}`;
      return (
        path === pattern ||
        path.startsWith(`${pattern}?`) ||
        path.startsWith(`${pattern}&`) ||
        path.startsWith(`${pattern}/`)
      );
    });
  }

  // Otherwise, use FastAPI for all endpoints if USE_FASTAPI is true
  return USE_FASTAPI;
}

/**
 * Get the full URL for an API request
 */
function getApiUrlInternal(endpoint: string): string {
  // If endpoint is already a full URL, return it as-is
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  if (shouldUseFastAPI(endpoint)) {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${API_URL}${normalizedEndpoint}`;
  }
  return endpoint;
}

import { isAuthDisabled } from "./constants";
import { getSessionId } from "./session-id";

/**
 * Get JWT token for FastAPI requests
 * For cross-origin requests, we need to get the token from the bridge response
 * and add it to the Authorization header (cookies won't be sent cross-origin)
 */
async function getAuthTokenForFastAPI(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // If auth is disabled, return null (we'll use session ID instead)
  if (isAuthDisabled) {
    return null;
  }

  try {
    // Call bridge endpoint to get token
    // The endpoint sets a cookie (for same-origin) and returns token (for cross-origin)
    const response = await fetch("/api/auth/jwt-bridge", {
      credentials: "include", // Include cookies in request
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Return token for use in Authorization header (cross-origin requests)
    return data.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Enhanced fetch that routes to FastAPI or Next.js API routes
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const fullUrl = getApiUrlInternal(url);

  // Prepare headers
  const headers = new Headers(init?.headers);

  // For FastAPI requests (cross-origin), get token and add to Authorization header
  // Note: httpOnly cookies won't be sent cross-origin, so we use Authorization header
  if (shouldUseFastAPI(url)) {
    if (isAuthDisabled) {
      // When auth is disabled, send session ID in a custom header
      const sessionId = getSessionId();
      headers.set("X-Session-Id", sessionId);
    } else {
      const token = await getAuthTokenForFastAPI();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // Ensure Content-Type is set for FastAPI (but not for FormData - browser will set it)
    if (
      !headers.has("Content-Type") &&
      init?.body &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
  }

  // Create new request with updated URL and headers
  // Include credentials to send cookies (for same-origin requests)
  const newInit: RequestInit = {
    ...init,
    headers,
    credentials: "include", // Include cookies for same-origin requests
  };

  return fetch(fullUrl, newInit);
}

/**
 * Get the API base URL (for constructing URLs manually if needed)
 */
export function getApiBaseUrl(): string {
  return USE_FASTAPI ? API_URL : "";
}

/**
 * Get the full URL for an endpoint (exported for use in components)
 */
export function getApiUrl(endpoint: string): string {
  return getApiUrlInternal(endpoint);
}

/**
 * Check if FastAPI is enabled for a specific endpoint
 */
export function isFastAPIEndpoint(endpoint: string): boolean {
  return shouldUseFastAPI(endpoint);
}
