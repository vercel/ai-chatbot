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
 * Check if an endpoint should be routed to FastAPI backend
 */
function shouldUseFastAPI(endpoint: string): boolean {
  if (!USE_FASTAPI && FASTAPI_ENDPOINTS.length === 0) {
    return false;
  }

  // If specific endpoints are configured, check if this endpoint matches
  if (FASTAPI_ENDPOINTS.length > 0) {
    return FASTAPI_ENDPOINTS.some((ep) => endpoint.includes(`/api/${ep}`));
  }

  // Otherwise, use FastAPI for all endpoints if USE_FASTAPI is true
  return USE_FASTAPI;
}

/**
 * Get the full URL for an API request
 */
function getApiUrlInternal(endpoint: string): string {
  if (shouldUseFastAPI(endpoint)) {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${API_URL}${normalizedEndpoint}`;
  }
  return endpoint;
}

/**
 * Check if a JWT token is expired
 * JWT tokens have an 'exp' claim (expiration timestamp in seconds)
 */
function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT payload (base64url encoded)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true; // Invalid token format
    }

    // Decode payload (second part)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    if (!payload.exp) {
      return true; // No expiration claim
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    // Consider token expired if it expires within the next 60 seconds (refresh buffer)
    return now >= expirationTime - 60_000;
  } catch {
    return true; // If we can't parse, consider it expired
  }
}

/**
 * Fetch JWT token from NextAuth bridge endpoint
 */
async function fetchJWTToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/jwt-bridge");
    if (!response.ok) {
      // If not authenticated, return null (don't throw)
      if (response.status === 401) {
        return null;
      }
      console.error("Failed to get JWT token:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error("Error fetching JWT token:", error);
    return null;
  }
}

/**
 * Get authentication token for FastAPI requests
 * Fetches from NextAuth bridge and caches in localStorage
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Check if we have a cached token
  let token = localStorage.getItem("auth_token");

  // If no token or expired, fetch new one from bridge
  if (!token || isTokenExpired(token)) {
    token = await fetchJWTToken();
    if (token) {
      // Cache the new token
      localStorage.setItem("auth_token", token);
    } else {
      // Remove expired/invalid token from cache
      localStorage.removeItem("auth_token");
    }
  }

  return token;
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

  // Add JWT token for FastAPI requests
  if (shouldUseFastAPI(url)) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
  const newInit: RequestInit = {
    ...init,
    headers,
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
