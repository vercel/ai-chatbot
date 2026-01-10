import type { NextAuthConfig } from "next-auth";

// Auth configuration for NextAuth.js
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [],
  callbacks: {},
};
