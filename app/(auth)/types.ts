import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    email?: string | null;
    preferredName?: string;
  }

  interface Session {
    user: User;
  }
}
