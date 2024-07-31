import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import AzureAd from "next-auth/providers/azure-ad"

import type { NextAuthConfig, Session } from 'next-auth';

export const config = {
  theme: {
    logo: 'https://next-auth.js.org/img/logo/logo-sm.png',
  },
  providers: [
    Google({
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar',
            // and more scope urls
          ].join(' '),
          response: 'code',
        },
      },
    }),
    AzureAd({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
    })
  ],
  // basePath: '/api/auth',
  callbacks: {
    authorized({ request, auth }) {
      return !!auth;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          access_token: account.access_token,
          issued_at: Date.now(),
          expires_at: Date.now() + Number(account.expires_in) * 1000, // 3600 seconds
          refresh_token: account.refresh_token,
        };
      } else if (Date.now() < Number(token.expires_at)) {
        return token;
      } else {
        console.log('Access token expired getting new one');
        try {
          const response = await fetch('https://login.microsoftonline.com/0c4da9c5-40ea-4e7d-9c7a-e7308d4f8e38/oauth2/v2.0/token', {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID as string, // Type assertion
              client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET as string, // Type assertion
              grant_type: 'refresh_token',
              refresh_token: token.refresh_token as string, // Type assertion
            }),
            method: 'POST',
          });
          // const response = await fetch('https://oauth2.googleapis.com/token', {
          //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          //   body: new URLSearchParams({
          //     client_id: process.env.AUTH_GOOGLE_ID as string, // Type assertion
          //     client_secret: process.env.AUTH_GOOGLE_SECRET as string, // Type assertion
          //     grant_type: 'refresh_token',
          //     refresh_token: token.refresh_token as string, // Type assertion
          //   }),
          //   method: 'POST',
          // });

          const tokens = await response.json();

          if (!response.ok) throw tokens;

          return {
            ...token, // Keep the previous token properties
            access_token: tokens.access_token,
            expires_at: Date.now() + Number(tokens.expires_in) * 1000,
            // Fall back to old refresh token, but note that
            // many providers may only allow using a refresh token once.
            refresh_token: tokens.refresh_token ?? token.refresh_token,
          }; // updated inside our session-token cookie
        } catch (error) {
          console.error('Error refreshing access token', error);
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: 'RefreshAccessTokenError' as const };
        }
      }
    },
    async session({ session, token }) {
      console.log('Incoming session info: ', session);
      // This will be accessible in the client side using useSession hook
      // So becareful what you return here. Don't return sensitive data.
      // The auth() function should return jwt response but instead it returns
      // the session object. This is a bug in next-auth.
      // Follow this bug https://github.com/nextauthjs/next-auth/issues/9329
      return {
        ...session,
        accessToken: String(token.access_token),
        refreshToken: String(token.refresh_token),
        accessTokenIssuedAt: Number(token.issued_at),
        accessTokenExpiresAt: Number(token.expires_at),
      } satisfies EnrichedSession;
    },
  },
} satisfies NextAuthConfig;

export interface EnrichedSession extends Session {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  accessTokenIssuedAt: number;
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);