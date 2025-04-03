import { chatConfig } from '@/lib/chat-config';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRegisterPage = nextUrl.pathname.startsWith('/register');
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      const isOnChatPage = nextUrl.pathname.startsWith('/');

      // If logged in, redirect to home page
      if (isLoggedIn && (isOnLoginPage || isOnRegisterPage)) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      // Always allow access to register and login pages
      if (isOnRegisterPage || isOnLoginPage) {
        return true;
      }

      // Redirect unauthenticated users to login page
      if (isOnChatPage && !chatConfig.guestUsage.isEnabled) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
