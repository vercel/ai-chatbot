import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";

import { getUser, createUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

console.log('Auth.js is being loaded');
console.log('Environment variables check:');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('AUTH_SECRET exists:', !!process.env.AUTH_SECRET);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut: nextAuthSignOut,
} = NextAuth({
  ...authConfig,
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account', // Always show account selection
        },
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          console.log('Credential sign in attempt for:', email);
          const users = await getUser(email);
          if (users.length === 0) {
            console.log('No user found with email:', email);
            return null;
          }
          
          const user = users[0];
          if (!user.password) {
            console.log('User has no password (OAuth user)');
            return null;
          }
          
          const passwordsMatch = await compare(password, user.password);
          if (!passwordsMatch) {
            console.log('Password mismatch');
            return null;
          }
          
          console.log('Successful credential sign in');
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Error in credential authorization:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      console.log('Sign in callback triggered:', { 
        provider: account?.provider, 
        email: user.email,
        name: user.name 
      });
      
      if (account?.provider === "google") {
        try {
          console.log('Processing Google sign in for:', user.email);
          
          // Check if user exists
          const existingUsers = await getUser(user.email!);
          
          if (existingUsers.length === 0) {
            console.log('Creating new user from Google sign in');
            const newUser = await createUser(
              user.email!,
              null, // No password for Google users
              user.name || null,
              user.image || null
            );
            console.log('Successfully created new user:', newUser.id);
          } else {
            console.log('User already exists:', existingUsers[0].id);
            // Optionally update user info if needed
            const existingUser = existingUsers[0];
            if (existingUser.name !== user.name || existingUser.image !== user.image) {
              console.log('Updating user info from Google');
              // You might want to add an updateUser function call here
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error handling Google sign in:', error);
          return false;
        }
      }
      
      // Allow credential sign ins
      return true;
    },
    
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token: !!token, user: !!user, account: !!account });
      
      if (user) {
        token.id = user.id;
      }
      
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      console.log('Session callback:', { session: !!session, token: !!token });
      
      if (session.user && token) {
        // Fetch fresh user data to ensure we have the correct ID
        try {
          const users = await getUser(session.user.email!);
          if (users.length > 0) {
            session.user.id = users[0].id;
            session.user.name = users[0].name;
            session.user.image = users[0].image;
          }
        } catch (error) {
          console.error('Error fetching user in session callback:', error);
        }
      }
      
      return session;
    },
  },
  
  // Add session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Add events for debugging
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('SignIn event:', { 
        user: user.email, 
        provider: account?.provider, 
        isNewUser 
      });
    },
    async signOut({ session, token }) {
      console.log('SignOut event:', { user: session?.user?.email });
    },
  },

  // Configure sign-out redirect
  pages: {
    ...authConfig.pages,
    signOut: '/login', // This will redirect to login after sign out
  },
});

// Custom sign out function with automatic redirect to login
export const signOut = async (options?: { redirect?: boolean }) => {
  const { redirect = true } = options || {};
  
  if (typeof window !== 'undefined') {
    // Client-side sign out
    const { signOut: clientSignOut } = await import('next-auth/react');
    return clientSignOut({
      callbackUrl: '/login',
      redirect,
    });
  } else {
    // Server-side sign out
    return nextAuthSignOut();
  }
};

console.log('NextAuth configuration complete');