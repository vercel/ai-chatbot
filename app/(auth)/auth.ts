import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
// import GoogleProvider from "next-auth/providers/google";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  debug: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
  ],
  callbacks: {
    // async signIn({ user, account, profile }) {
    //   console.log('Sign in callback:', { user, account, profile });
    //   if (account?.provider === "google") {
    //     try {
    //       // Check if user exists
    //       const users = await getUser(user.email!);
    //       if (users.length === 0) {
    //         // Create new user if doesn't exist
    //         await createUser(
    //           user.email!,
    //           null, // No password for Google users
    //           user.name || null,
    //           user.image || null
    //         );
    //         // console.log('Created new user from Google sign in');
    //       } else {
    //         // Update existing user's name and image if they've changed
    //         // You might want to add an updateUser function to handle this
    //         console.log('User already exists');
    //       }
    //       return true;
    //     } catch (error) {
    //       // console.error('Error handling Google sign in:', error);
    //       return false;
    //     }
    //   }
    //   return true;
    // },
    async jwt({ token, user, account }) {
      // console.log('JWT callback:', { token, user, account });
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      // console.log('Session callback:', { session, token });
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signOut(params) {
      // Handle both session and token cases
      if ('session' in params && params.session?.user?.email) {
        console.log('SignOut event:', { user: params.session.user.email });
      } else if ('token' in params && params.token?.email) {
        console.log('SignOut event:', { user: params.token.email });
      }
      return true;
    },
  },
});
