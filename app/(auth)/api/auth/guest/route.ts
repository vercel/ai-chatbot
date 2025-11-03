import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  try {
    return await signIn("guest", { redirect: true, redirectTo: redirectUrl });
  } catch (err: any) {
    console.error("Guest sign-in failed", err);
    const message = err?.message || String(err);
    return NextResponse.json(
      { error: "guest_signin_failed", message },
      { status: 500 }
    );
  }
}
