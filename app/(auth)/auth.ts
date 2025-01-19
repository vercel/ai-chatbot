import { compare } from "bcrypt-ts";
import NextAuth, { type User, type Session } from "next-auth";
import Github from "next-auth/providers/github";
import Okta from "next-auth/providers/okta";
import Credentials from "next-auth/providers/credentials";
import CredentialsProvider from "next-auth/providers/credentials";

import { createSSOUser, getUser } from "@/lib/db/queries";

import { authConfig } from "./auth.config";
import { use } from "react";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // Credentials({
    //   credentials: {},
    //   async authorize({ email, password }: any) {
    //     const users = await getUser(email);
    //     if (users.length === 0) return null;
    //     // biome-ignore lint: Forbidden non-null assertion.
    //     const passwordsMatch = await compare(password, users[0].password!);
    //     if (!passwordsMatch) return null;
    //     return users[0] as any;
    //   },
    // }),
    Github,
    // CredentialsProvider({
    //   name: "Github SSO",
    //   credentials: {
    //     code: { label: "code", type: "text" },
    //   },
    //   async authorize(credentials) {
    //     const { code } = credentials;

    //     // Step 1: Access Token 요청
    //     const tokenResponse = await fetch(
    //       "https://github.com/login/oauth/access_token",
    //       {
    //         method: "POST",
    //         headers: {
    //           Accept: "application/json",
    //           "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //           client_id: process.env.GITHUB_CLIENT_ID,
    //           client_secret: process.env.GITHUB_CLIENT_SECRET,
    //           code,
    //         }),
    //       }
    //     );

    //     const tokenData = await tokenResponse.json();
    //     if (!tokenData.access_token) {
    //       throw new Error("Failed to retrieve GitHub access token");
    //     }

    //     const accessToken = tokenData.access_token;

    //     // Step 2: User 정보 요청
    //     const userResponse = await fetch("https://api.github.com/user", {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //     });

    //     const userData = await userResponse.json();

    //     if (!userData || !userData.id) {
    //       throw new Error("Failed to fetch GitHub user data");
    //     }

    //     // 사용자 정보 반환
    //     return {
    //       id: userData.id,
    //       name: userData.name || userData.login,
    //       email: userData.email || `${userData.login}@github.com`,
    //       image: userData.avatar_url,
    //     };
    //   },
    // }),
  ],
  callbacks: {
    async jwt({ token, user, profile }) {
      if (token.email) {
        const [githubUser_id] = await getUser(token.email);

        // Update github user id to token
        if (githubUser_id) {
          token.id = githubUser_id;
        }
      }
      //session 추가
      if (profile) {
        token.email = profile.email || null;
      }
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        if (user && user.id && user.email && user.name) {
          const [githubUser] = await getUser(user?.email);
          if (githubUser) {
            return true;
          } else {
            //create User if uset not exists
            await createSSOUser(user.id, user.email, user.name);
          }
        }
      }
      return true;
    },
  },
});
