import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true, // <-- this is the fix
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [],
  callbacks: {},
} satisfies NextAuthConfig;
