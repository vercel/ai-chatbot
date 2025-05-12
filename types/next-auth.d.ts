import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  }
} 