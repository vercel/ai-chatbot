import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/auth/route-guards";
import { deleteGoogleTokensByUserId, getGoogleTokensByUserId } from "@/lib/db/queries";

export const POST = withAuthApi(async ({ session }) => {
  const row = await getGoogleTokensByUserId(session.user.id);
  const tokenToRevoke = row?.refreshToken || row?.accessToken;
  if (tokenToRevoke) {
    try {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: tokenToRevoke }),
      });
    } catch {}
  }

  await deleteGoogleTokensByUserId(session.user.id);
  return NextResponse.json({ disconnected: true });
});

