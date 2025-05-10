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

// Log auth configuration on startup
console.log('NextAuth Configuration:', {
  trustHost: authConfig.trustHost,
  pages: authConfig.pages,
  baseUrl: process.env.NEXTAUTH_URL || 'not set',
});
