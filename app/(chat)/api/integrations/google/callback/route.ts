import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuthApi } from "@/lib/auth/route-guards";
import { upsertGoogleTokens } from "@/lib/db/queries";

export const GET = withAuthApi(async ({ request, session }) => {
  const url = new URL((request as NextRequest).url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("g_oauth_state")?.value;
  const returnTo = jar.get("g_oauth_return")?.value ?? "/settings";

  if (!code || !state || !expectedState || state !== expectedState) {
    const bad = NextResponse.redirect(returnTo);
    bad.cookies.delete("g_oauth_state");
    bad.cookies.delete("g_oauth_return");
    return bad;
  }

  const res = NextResponse.redirect(
    new URL(returnTo, url.origin)
  );
  res.cookies.delete("g_oauth_state");
  res.cookies.delete("g_oauth_return");

  try {
    // Exchange code for tokens
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenRes.ok) {
      const code = `exchange_failed_${tokenRes.status}`;
      const redirectUrl = new URL(returnTo, url.origin);
      redirectUrl.searchParams.set("google_error", code);
      return NextResponse.redirect(redirectUrl);
    }

    const json = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      scope?: string;
      expires_in?: number;
    };

    const expiry = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000)
      : null;

    await upsertGoogleTokens({
      userId: session.user.id,
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      scope: json.scope ?? null,
      tokenType: json.token_type ?? null,
      expiry,
    });
  } catch {
    // Surface DB or network errors via query param and log.
    console.error("google_callback_error: failed to save credentials");
    const redirectUrl = new URL(returnTo, url.origin);
    redirectUrl.searchParams.set("google_error", "db_upsert_failed");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
});
