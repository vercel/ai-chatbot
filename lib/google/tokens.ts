import { getGoogleTokensByUserId, upsertGoogleTokens } from "@/lib/db/queries";

export type RefreshResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
};

export async function getAccessTokenForUser(
  userId: string
): Promise<string | null> {
  const row = await getGoogleTokensByUserId(userId);
  if (!row) return null;

  const needsRefresh =
    !!row.refreshToken &&
    !!row.expiry &&
    row.expiry.getTime() <= Date.now() + 30_000;

  if (!needsRefresh) return row.accessToken;

  const refreshed = await refreshAccessToken(row.refreshToken!);
  if (!refreshed) return row.accessToken; // fall back to current

  await upsertGoogleTokens({
    userId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? row.refreshToken ?? null,
    scope: refreshed.scope ?? row.scope ?? undefined,
    tokenType: refreshed.token_type ?? row.tokenType ?? undefined,
    expiry: refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : null,
  });
  return refreshed.access_token;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse | null> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  return (await res.json()) as RefreshResponse;
}
