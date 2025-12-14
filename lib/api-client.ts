/**
 * Simplified API Client - Direct FastAPI calls
 *
 * This simplified version removes complex routing logic.
 * Most endpoints go directly to FastAPI, with only special cases using Next.js proxies.
 *
 * Special cases that use Next.js proxies:
 * - /api/auth/me - Cookie forwarding proxy
 * - /api/auth/guest - Cookie setting + redirect
 * - /api/tokenlens - Third-party service integration
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Check if endpoint should use Next.js proxy (special cases only)
 *
 * These endpoints need Next.js because:
 * - Cookie handling (can't be done in Server Components)
 * - Redirects after cookie setting
 * - Third-party integrations (tokenlens)
 */
function shouldUseNextJSProxy(endpoint: string): boolean {
  // Extract path (ignore query params)
  const path = endpoint.split("?")[0].split("#")[0];

  // Special cases that stay in Next.js
  const nextjsProxies = [
    "/api/auth/me", // Cookie forwarding proxy
    "/api/auth/guest", // Cookie setting + redirect
    "/api/tokenlens", // Third-party service (TokenLens)
    // Add streaming endpoints here if keeping them in Next.js
    // "/api/chat/stream",     // If keeping Next.js streaming
  ];

  return nextjsProxies.some((proxy) => path.startsWith(proxy));
}

/**
 * Get the full URL for an API request
 *
 * - Next.js proxies: return as-is (relative URL)
 * - FastAPI endpoints: construct absolute URL
 */
export function getApiUrl(endpoint: string): string {
  // If already absolute URL, return as-is
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  // Next.js proxies: return relative URL
  if (shouldUseNextJSProxy(endpoint)) {
    return endpoint;
  }

  // FastAPI: construct absolute URL
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  return `${API_URL}${normalizedEndpoint}`;
}

/**
 * Enhanced fetch that routes to FastAPI or Next.js proxies
 *
 * - Handles authentication automatically via cookies
 * - Routes to FastAPI by default
 * - Uses Next.js proxies for special cases
 */
export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let requestUrl: string;
  if (typeof input === "string") {
    requestUrl = input;
  } else if (input instanceof URL) {
    requestUrl = input.toString();
  } else {
    // input is a Request object
    requestUrl = input.url;
  }

  const fullUrl = getApiUrl(requestUrl);
  const usesNextJSProxy = shouldUseNextJSProxy(requestUrl);

  // Prepare request headers
  const requestHeaders = new Headers(init?.headers);

  // For FastAPI requests (not Next.js proxies), ensure Content-Type is set
  // Note: Cookies are sent automatically with credentials: "include"
  // Server-side might need manual cookie forwarding (handled in server-api-client.ts)
  if (
    !usesNextJSProxy &&
    !requestHeaders.has("Content-Type") &&
    init?.body &&
    !(init.body instanceof FormData)
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Create request with updated headers
  const newInit: RequestInit = {
    ...init,
    headers: requestHeaders,
    credentials: "include", // Always include cookies
  };

  return fetch(fullUrl, newInit);
}

/**
 * Get the API base URL (for constructing URLs manually if needed)
 */
export function getApiBaseUrl(): string {
  return API_URL;
}

/**
 * Check if an endpoint uses Next.js proxy
 */
export function isNextJSProxy(endpoint: string): boolean {
  return shouldUseNextJSProxy(endpoint);
}

/**
 * @deprecated Use isNextJSProxy() instead. This function is kept for backward compatibility.
 */
export function isFastAPIEndpoint(endpoint: string): boolean {
  return !shouldUseNextJSProxy(endpoint);
}
