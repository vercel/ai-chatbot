import NextAuth, { type DefaultSession } from 'next-auth';

import { authConfig } from './config';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      type: UserType;
    };
  }

  interface User {
    userType?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    type?: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth(authConfig);

export const getServerAuthSession = auth;
