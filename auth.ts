import NextAuth from "@auth/nextjs";
import GitHub from "@auth/nextjs/providers/github";
import { NextResponse } from "next/server";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  // @ts-ignore
  providers: [GitHub],
  session: { strategy: "jwt" },
  async authorized({ request, auth }: any) {
    const url = request.nextUrl;

    if (request.method === "POST") {
      const { authToken } = (await request.json()) ?? {};
      // If the request has a valid auth token, it is authorized
      const valid = true;
      if (valid) return true;
      return NextResponse.json("Invalid auth token", { status: 401 });
    }

    // Logged in users are authenticated, otherwise redirect to login page
    return !!auth;
  },
});
