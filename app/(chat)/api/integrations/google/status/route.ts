import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/auth/route-guards";
import { getGoogleTokensByUserId } from "@/lib/db/queries";

export const GET = withAuthApi(async ({ session }) => {
  try {
    const row = await getGoogleTokensByUserId(session.user.id);
    const now = Date.now();
    const expiryMs = row?.expiry ? row.expiry.getTime() : null;
    const expiresInSeconds = expiryMs
      ? Math.max(0, Math.floor((expiryMs - now) / 1000))
      : null;

    return NextResponse.json({
      connected: !!row,
      expiresAt: expiryMs ? Math.floor(expiryMs / 1000) : null,
      expiresInSeconds,
      needsRefresh: expiryMs ? expiryMs <= now + 30_000 : false,
    });
  } catch (error) {
    // Degrade gracefully if DB/migration is not ready.
    return NextResponse.json({ connected: false, error: "unavailable" });
  }
});
