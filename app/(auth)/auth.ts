import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { getUser, createUser, updateUser } from '@/lib/db/queries';
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
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize({ email, password }: any) {
        try {
          console.log('Credential sign in attempt for:', email);

          if (!email || !password) {
            console.log('Missing email or password');
            return null;
          }

          const users = await getUser(email);
          if (users.length === 0) {
            console.log('No user found with email:', email);
            return null;
          }

          const user = users[0];

          // Handle special email verification auto-login
          if (password === '__EMAIL_VERIFIED__') {
            console.log('Email verification auto-login');
            if (!user.email_verified) {
              console.log('User email not verified for auto-login');
              return null;
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }

          // Regular password authentication
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
        name: user.name,
      });

      if (account?.provider === 'google') {
        try {
          console.log('Processing Google sign in for:', user.email);

          if (!user.email) {
            console.log('No email provided by Google');
            return false;
          }

          // Check if user exists
          const existingUsers = await getUser(user.email);

          if (existingUsers.length === 0) {
            console.log('Creating new user from Google sign in');
            try {
              const newUser = await createUser(
                user.email,
                null, // No password for Google users
                user.name || null,
                user.image || null,
              );

              // Mark email as verified for OAuth users
              await updateUser(newUser.id, { emailVerified: true });
              console.log('Successfully created new user:', newUser.id);
            } catch (createError) {
              console.error('Failed to create user:', createError);
              return false;
            }
          } else {
            console.log('User already exists:', existingUsers[0].id);
            const existingUser = existingUsers[0];

            // Update user info if needed and ensure email is verified for OAuth users
            const needsUpdate =
              existingUser.name !== user.name ||
              existingUser.image !== user.image ||
              !existingUser.email_verified;

            if (needsUpdate) {
              console.log('Updating user info from Google');
              try {
                await updateUser(existingUser.id, {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  emailVerified: true,
                });
              } catch (updateError) {
                console.error('Failed to update user:', updateError);
                // Don't fail the sign in for update errors
              }
            }
          }

          return true;
        } catch (error) {
          console.error('Error handling Google sign in:', error);
          return false;
        }
      }

      // Allow credential sign ins (they've already been validated in authorize)
      return true;
    },

    async jwt({ token, user, account }) {
      console.log('JWT callback:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
      });

      // First time sign in - user object will be available
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      // Store access token if available
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({
      session,
      token,
    }: { session: ExtendedSession; token: any }) {
      console.log('Session callback:', {
        hasSession: !!session,
        hasToken: !!token,
        sessionEmail: session.user?.email,
        tokenId: token?.id,
      });

      if (session.user && token) {
        try {
          // Use token data first (most reliable)
          if (token.id) {
            session.user.id = token.id;
            session.user.email = token.email || session.user.email;
            session.user.name = token.name || session.user.name;
            session.user.image = token.image || session.user.image;
          } else if (session.user.email) {
            // Fallback: fetch user data if token doesn't have ID
            console.log(
              'Token missing ID, fetching user data for:',
              session.user.email,
            );
            const users = await getUser(session.user.email);

            if (users.length > 0) {
              const userData = users[0];
              session.user.id = userData.id;
              session.user.name = userData.name || session.user.name;
              session.user.image = userData.image || session.user.image;
              console.log('Session user data updated from database');
            } else {
              console.log('No user found in session callback');
            }
          }
        } catch (error) {
          console.error('Error in session callback:', error);
          // Don't throw error - just log it and continue with whatever session data we have
          // This prevents the session callback from breaking the entire auth flow
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('SignIn event:', {
        provider: account?.provider,
        email: user.email,
      });
    },
    async signOut({ session, token }: any) {
      console.log('SignOut event:', {
        email: session?.user?.email || token?.email,
      });
    },
    async createUser({ user }) {
      console.log('CreateUser event:', { email: user.email, id: user.id });
    },
  },
  // Add error handling
  logger: {
    error(code, ...message) {
      console.error(`NextAuth Error [${code}]:`, ...message);
    },
    warn(code, ...message) {
      console.warn(`NextAuth Warning [${code}]:`, ...message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth Debug [${code}]:`, ...message);
      }
    },
  },
});
