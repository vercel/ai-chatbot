/**
 * API Client that routes requests to either Next.js API routes or FastAPI backend
 * based on environment configuration.
 *
 * Usage:
 * - Set NEXT_PUBLIC_API_URL=http://localhost:8000
 * - Set NEXT_PUBLIC_USE_FASTAPI_BACKEND=true to enable FastAPI routing
 * - Or set NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat,history,vote to selectively route specific endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_FASTAPI = process.env.NEXT_PUBLIC_USE_FASTAPI_BACKEND === 'true';
const FASTAPI_ENDPOINTS = process.env.NEXT_PUBLIC_FASTAPI_ENDPOINTS?.split(',') || [];

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
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_URL}${normalizedEndpoint}`;
  }
  return endpoint;
}

/**
 * Get authentication token for FastAPI requests
 * For now, this gets JWT from localStorage (set after FastAPI auth)
 * TODO: Bridge NextAuth session to JWT token if needed
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

/**
 * Enhanced fetch that routes to FastAPI or Next.js API routes
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const fullUrl = getApiUrlInternal(url);

  // Prepare headers
  const headers = new Headers(init?.headers);

  // Add JWT token for FastAPI requests
  if (shouldUseFastAPI(url)) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Ensure Content-Type is set for FastAPI (but not for FormData - browser will set it)
    if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
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
  return USE_FASTAPI ? API_URL : '';
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

