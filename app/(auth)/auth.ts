import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import type { DefaultJWT } from 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';

export type UserType = 'cognito';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      type?: UserType;
      name?: string | null;
      email?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    type?: UserType;
    name?: string | null;
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
