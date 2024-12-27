import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/autologin",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "none",
        secure: true,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Check API key for ingest endpoint
      if (path.startsWith("/api/ingest")) {
        const authHeader = headers.get("authorization");
        return authHeader === `Bearer ${process.env.API_KEY}`;
      }

      // If user is logged in and tries to access /autologin, redirect to home
      if (path.startsWith("/autologin") && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Always allow these paths
      if (
        path.startsWith("/autologin") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/login")
      ) {
        return true;
      }

      if (path.startsWith("/")) {
        return isLoggedIn;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
