import { compare } from 'bcryptjs';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular' | 'premium';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      isAdmin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    isAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    isAdmin?: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        console.log('[AUTH] Starting authorization for email:', email);
        console.log('[AUTH] Environment:', process.env.NODE_ENV);
        
        try {
          const users = await getUser(email);
          console.log('[AUTH] Users found:', users.length);

          if (users.length === 0) {
            console.log('[AUTH] No user found, running dummy password comparison');
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [user] = users;
          console.log('[AUTH] User found - ID:', user.id, 'Has password:', !!user.password);

          if (!user.password) {
            console.log('[AUTH] User has no password, running dummy comparison');
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          console.log('[AUTH] Starting password comparison');
          console.log('[AUTH] Password hash preview:', user.password.substring(0, 10) + '...');
          
          const passwordsMatch = await compare(password, user.password);
          console.log('[AUTH] Password comparison result:', passwordsMatch);

          if (!passwordsMatch) {
            console.log('[AUTH] Password mismatch, returning null');
            return null;
          }

          console.log('[AUTH] Authentication successful');
          return { ...user, type: 'regular', isAdmin: user.isAdmin };
        } catch (error) {
          console.error('[AUTH] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.isAdmin = user.isAdmin;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.isAdmin = token.isAdmin;
      }

      return session;
    },
  },
});
