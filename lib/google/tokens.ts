import "server-only";

import { ChatSDKError } from "@/lib/errors";
import { getGoogleTokensByUserId, upsertGoogleTokens } from "@/lib/db/queries";

type RefreshResponse = {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  refresh_token?: string;
};

/**
 * Returns a valid access token for the given user. If the stored token is
 * near expiry and a refresh token is available, performs a refresh and
 * persists the new credentials.
 */
export async function getAccessTokenForUser(userId: string): Promise<string | null> {
  const row = await getGoogleTokensByUserId(userId);
  if (!row) return null;

  const now = Date.now();
  const expiryMs = row.expiry ? row.expiry.getTime() : null;
  const needsRefresh = !!row.refreshToken && !!expiryMs && expiryMs <= now + 30_000;

  if (!needsRefresh) return row.accessToken;

  try {
    const refreshed = await refreshAccessToken(row.refreshToken!);
    await upsertGoogleTokens({
      userId,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? row.refreshToken ?? null,
      scope: refreshed.scope ?? row.scope ?? null,
      tokenType: refreshed.token_type ?? row.tokenType ?? null,
      expiry: refreshed.expires_in ? new Date(now + refreshed.expires_in * 1000) : null,
    });
    return refreshed.access_token;
  } catch (err) {
    // If refresh fails, return the existing access token (may expire soon)
    // and let the caller handle 401s by prompting the user to reconnect.
    return row.accessToken;
  }
}

/**
 * Exchanges a refresh_token for a new access_token using Google's OAuth endpoint.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ChatSDKError("bad_request:api", "Missing GOOGLE_CLIENT_ID/SECRET for refresh");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChatSDKError("bad_request:auth", `Google refresh failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as RefreshResponse;
  if (!json.access_token) {
    throw new ChatSDKError("bad_request:auth", "No access_token in refresh response");
  }
  return json;
}
