import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';
export type UserRole = 'user' | 'admin';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    role: UserRole;
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
        console.log(`NextAuth authorize called for email: ${email}`);

        try {
          const users = await getUser(email);
          console.log(`User lookup results: Found ${users.length} users`);

          if (users.length === 0) {
            console.log(
              'No user found with this email, using dummy comparison to prevent timing attacks',
            );
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [user] = users;
          console.log(`Found user with ID: ${user.id}, checking password`);

          if (!user.password) {
            console.log('User has no password set, using dummy comparison');
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const passwordsMatch = await compare(password, user.password);
          console.log(
            `Password comparison result: ${passwordsMatch ? 'match' : 'no match'}`,
          );

          if (!passwordsMatch) {
            console.log('Password does not match, authentication failed');
            return null;
          }

          console.log(
            `User authenticated successfully, type: regular, role: ${user.role || 'user'}`,
          );
          return { ...user, type: 'regular', role: user.role || 'user' };
        } catch (error) {
          console.error('Error during credentials authorization:', error);
          throw error;
        }
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        console.log('Creating guest user account');
        try {
          const [guestUser] = await createGuestUser();
          console.log(`Guest user created with ID: ${guestUser.id}`);
          return { ...guestUser, type: 'guest', role: 'user' };
        } catch (error) {
          console.error('Error creating guest user:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback called', {
        hasUser: !!user,
        tokenSubject: token.sub,
      });

      if (user) {
        console.log('Adding user data to token', {
          userId: user.id,
          userType: user.type,
          userRole: user.role || 'user',
        });

        token.id = user.id as string;
        token.type = user.type;
        token.role = user.role || 'user';
      }

      return token;
    },
    async session({ session, token }) {
      console.log('Session callback called', {
        hasSession: !!session,
        hasToken: !!token,
        tokenId: token.id,
      });

      if (session.user) {
        console.log('Adding token data to session user object');
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
