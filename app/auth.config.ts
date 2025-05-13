import type { NextAuthConfig } from 'next-auth';
import { isDevelopmentEnvironment } from '../lib/constants';
import CognitoProvider from 'next-auth/providers/cognito';
import type { UserType } from '@/app/(auth)/auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/chat');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/chat', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id && user?.type) {
        token.id = user.id;
        token.type = user.type as UserType;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id && token.type) {
        session.user.id = token.id;
        session.user.type = token.type as UserType;
      }
      return session;
    },
  },
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: isDevelopmentEnvironment ? 'next-auth.session-token' : '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopmentEnvironment,
      },
    },
  },
} satisfies NextAuthConfig; 