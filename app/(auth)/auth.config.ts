import { anonymousRegex } from '@/lib/constants';
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
      const isAnonymousUser = anonymousRegex.test(auth?.user?.email ?? '');

      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      const isOnRegisterPage = nextUrl.pathname.startsWith('/register');

      // If logged in, redirect to home page
      if (
        isLoggedIn &&
        !isAnonymousUser &&
        (isOnLoginPage || isOnRegisterPage)
      ) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      // Always allow access to register and login pages
      if (isOnRegisterPage || isOnLoginPage) {
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
