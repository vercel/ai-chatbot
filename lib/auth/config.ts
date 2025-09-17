import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';

import { prisma } from '@/lib/db/client';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { DUMMY_PASSWORD } from '@/lib/constants';

const normalizeUserType = (userType?: string | null) =>
  userType === 'GUEST' ? 'guest' : 'regular';

const providers: NextAuthConfig['providers'] = [
  Credentials({
    id: 'credentials',
    name: 'Email and Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = String(credentials.email);
      const password = String(credentials.password);

      const users = await getUser(email);

      if (users.length === 0) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const [user] = users;

      if (!user.password) {
        await compare(password, DUMMY_PASSWORD);
        return null;
      }

      const passwordsMatch = await compare(password, user.password);

      if (!passwordsMatch) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        userType: user.userType,
      } as any;
    },
  }),
  Credentials({
    id: 'guest',
    name: 'Guest',
    credentials: {},
    async authorize() {
      const [guestUser] = await createGuestUser();
      return {
        id: guestUser.id,
        email: guestUser.email,
        userType: 'GUEST',
      } as any;
    },
  }),
];

if (process.env.AUTH_EMAIL_SERVER && process.env.AUTH_EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.AUTH_EMAIL_SERVER,
      from: process.env.AUTH_EMAIL_FROM,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (!session.user) {
        return session;
      }

      const dbUser =
        user ??
        (session.user.email
          ? await prisma.user.findUnique({ where: { email: session.user.email } })
          : null);

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.type = normalizeUserType(dbUser.userType);
        session.user.email = dbUser.email;
      } else {
        session.user.type = normalizeUserType('REGULAR');
      }

      return session;
    },
  },
};
