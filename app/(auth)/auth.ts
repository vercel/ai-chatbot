import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserWithOrganization } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      role: 'employee' | 'compliance_officer' | 'admin';
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    role: 'employee' | 'compliance_officer' | 'admin';
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    type?: UserType;
    role?: 'employee' | 'compliance_officer' | 'admin';
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
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
        try {
          const users = await getUserWithOrganization(email);

          if (users.length === 0) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [userWithOrg] = users;

          if (!userWithOrg.password) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const passwordsMatch = await compare(password, userWithOrg.password);

          if (!passwordsMatch) {
            return null;
          }

          return { 
            id: userWithOrg.id,
            email: userWithOrg.email,
            type: 'regular' as UserType,
            role: userWithOrg.role || 'employee',
            organizationId: userWithOrg.organizationId,
            organizationName: userWithOrg.organization.name,
            organizationSlug: userWithOrg.organization.slug,
          };
        } catch (error) {
          console.error('Authorization error:', error);
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
        token.role = user.role;
        token.organizationId = user.organizationId as string;
        token.organizationName = user.organizationName as string;
        token.organizationSlug = user.organizationSlug as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.organizationId || !token.organizationName || !token.organizationSlug) {
        throw new Error('Missing organization information in token');
      }

      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.type = token.type!;
        session.user.role = token.role!;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.organizationSlug = token.organizationSlug;
      }
      return session;
    },
  },
});
