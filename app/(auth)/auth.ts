import NextAuth, { type User, type Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { createSSOUser, getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

// Only include dev provider in development/preview
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.VERCEL_ENV === 'preview';

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  })
] as NextAuthConfig['providers'];

// Add development-only provider
if (isDevelopment) {
  providers.push(
    CredentialsProvider({
      id: 'dev-impersonate',
      name: 'Dev Impersonation',
      credentials: {},
      async authorize(credentials) {
        if (!isDevelopment) return null;
        return credentials as any;
      }
    })
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    async jwt({ token, user, profile }) {
      if (token.email) {
        const [user] = await getUser(token.email);
        if (user) {
          token.id = user.id;
        }
      }

      if (profile) {
        token.email = profile.email || null;
      }
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
    async signIn({ user, account }) {
      // For dev impersonation, always allow
      if (account?.provider === 'dev-impersonate') {
        return true;
      }
      
      // Normal Google auth flow
      if (account?.provider === 'google') {
        if (user?.id && user.email && user.name) {
          const [existingUser] = await getUser(user.email);

          if (existingUser) {
            return true;
          } else {
            await createSSOUser(user.id, user.email, user.name);
            return true;
          }
        }
        return false;
      }

      return true;
    },
  },
});
