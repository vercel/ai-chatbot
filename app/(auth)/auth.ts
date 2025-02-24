import NextAuth, { type User, type Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createSSOUser, getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    // Github({
    //   allowDangerousEmailAccountLinking: true,
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
  ],
  callbacks: {
    async jwt({ token, user, profile }) {
      if (token.email) {
        // const [githubUser_id] = await getUser(token.email);
        const [googleUser_id] = await getUser(token.email);

        if (googleUser_id) {
          token.id = googleUser_id;
        }
      }

      if (profile) {
        token.email = profile.email || null;
      }
      if (user) {
        token.id = user.id;
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
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      console.log('SignIn callback started:', { provider: account?.provider });
      
      if (account?.provider === 'google') {
        console.log('Google sign in - user data:', { 
          id: user?.id,
          email: user?.email,
          name: user?.name 
        });

        if (user?.id && user.email && user.name) {
          const [googleUser] = await getUser(user.email);
          console.log('Database lookup result:', { existingUser: googleUser });

          if (googleUser) {
            console.log('Existing user found, proceeding with sign in');
            return true;
          } else {
            console.log('Creating new user in database');
            await createSSOUser(user.id, user.email, user.name);
            console.log('New user created successfully');
            return true;
          }
        } else {
          console.log('Missing required user information:', { user });
          return false;
        }
      }
      return true;
    },
  },
});
