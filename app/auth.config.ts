import type { NextAuthConfig } from 'next-auth';
import { isDevelopmentEnvironment } from '../lib/constants';

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
  },
  providers: [
    {
      id: 'guest',
      type: 'credentials',
      name: 'Guest',
      credentials: {},
      async authorize(credentials, request) {
        return {
          id: 'guest',
          name: 'Guest User',
          email: 'guest@example.com',
          type: 'guest',
        };
      },
    },
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