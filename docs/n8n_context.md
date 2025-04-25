# N8N Context and Clerk OAuth Token Proxy

This document explains how N8N interacts with the application, specifically regarding Google OAuth access tokens managed by Clerk.

## Problem

N8N workflows often need to interact with external APIs (like Google APIs) on behalf of a user who authenticated via the main application.
Clerk handles the OAuth flow (e.g., Google Sign-In) and stores the necessary access and refresh tokens.

Directly calling the Clerk Backend API (`users.getUserOauthAccessToken`) from an N8N webhook triggered by Clerk (e.g., `user.created`) is problematic:

1.  **Timing:** The OAuth token might not be immediately available when the webhook fires.
2.  **Security:** Exposing the `CLERK_SECRET_KEY` directly to N8N increases the attack surface.
3.  **Complexity:** N8N would need to handle potential token refresh logic if it held long-lived refresh tokens (which it shouldn't).

## Solution: API Proxy Endpoint

To solve this, we implement a dedicated API proxy endpoint within our Next.js application (`/api/clerk-token-proxy`).

**Workflow:**

1.  **N8N Trigger:** An event occurs (e.g., user action in the app, scheduled trigger) that requires N8N to act on behalf of a user with Google.
2.  **N8N Gets User ID:** The N8N workflow obtains the relevant `clerkUserId` (this might come from the trigger payload or a previous step).
3.  **N8N Calls Proxy:** N8N makes an HTTP Request (POST) to our application's `/api/clerk-token-proxy` endpoint.
    *   **Authentication:** N8N sends a secret API Key (stored as an N8N credential and configured in our app via `N8N_PROXY_SECRET_KEY`) in the `Authorization: ApiKey <key>` header.
    *   **Body:** N8N sends `{ "clerkUserId": "user_..." }` in the request body.
4.  **Proxy Endpoint Logic (`/app/api/clerk-token-proxy/route.ts`):**
    *   Verifies the `Authorization: ApiKey <key>` header against `N8N_PROXY_SECRET_KEY`.
    *   Extracts the `clerkUserId` from the request body.
    *   Uses the application's `CLERK_SECRET_KEY` (securely stored as an environment variable) to instantiate the Clerk Backend SDK (`clerkClient`).
    *   Calls `clerkClient.users.getUserOauthAccessToken(clerkUserId, 'oauth_google')` to fetch the currently valid Google OAuth access token for the user.
    *   Returns the access token (and optionally expiry time) in a JSON response: `{ "accessToken": "ya29...", "expiresAt": 1... }`.
5.  **N8N Receives Token:** N8N receives the short-lived Google access token from the proxy.
6.  **N8N Calls Google API:** N8N uses the received `accessToken` as a Bearer token (`Authorization: Bearer ya29...`) in subsequent HTTP Request nodes to call the desired Google APIs (e.g., Google Drive, Calendar, UserInfo).

**Benefits:**

*   **Security:** The powerful `CLERK_SECRET_KEY` remains within the Next.js application environment and is never exposed to N8N.
*   **Simplicity:** N8N only needs to manage a simpler API key for the proxy and doesn't need to worry about OAuth specifics or token refresh.
*   **Reliability:** The proxy fetches the *current* valid access token on demand, avoiding timing issues associated with webhooks.
*   **Centralized Logic:** Token retrieval logic stays within the main application, closer to the Clerk SDK.

## N8N Configuration

1.  **Proxy API Key Credential:**
    *   Create a secure, random string to use as the API key.
    *   Store this key in your Next.js application's environment variables as `N8N_PROXY_SECRET_KEY`.
    *   In N8N, create a "Header Auth" credential:
        *   Name: `Authorization`
        *   Value: `ApiKey YOUR_SECURE_RANDOM_STRING` (Replace with the actual key)
2.  **HTTP Request Node (Calling the Proxy):**
    *   Method: `POST`
    *   URL: `YOUR_APPLICATION_URL/api/clerk-token-proxy`
    *   Authentication: Select the "Header Auth" credential created above.
    *   Body Content Type: `JSON`
    *   Specify Body: `Using Fields Below`
    *   Body Parameters:
        *   Name: `clerkUserId`, Value: (Use an N8N expression to get the required Clerk User ID, e.g., `{{ $json.data.id }}` or `{{ $env.CLERK_USER_ID }}` depending on your workflow context)
    *   Options -> Response Format: `JSON`
3.  **HTTP Request Node (Calling Google API):**
    *   Method: (e.g., `GET`, `POST`)
    *   URL: (The specific Google API endpoint)
    *   Authentication: `None`
    *   Send Headers: `ON`
    *   Specify Headers: `Using Fields Below`
    *   Header Parameters:
        *   Name: `Authorization`
        *   Value: `Bearer {{ $node["NameOfProxyCallNode"].json.accessToken }}` (Adjust node name as needed) 