import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      type?: 'cognito';
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    type: 'cognito';
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  }
} 