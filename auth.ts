import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './lib/db/client';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth } from 'better-auth';
import { anonymous, customSession } from 'better-auth/plugins';
import { eq, InferSelectModel } from 'drizzle-orm';
import { user } from './lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  appName: 'ai-chatbot',
  plugins: [
    anonymous(),
    nextCookies(),
    customSession(async ({ user: sessionUser, session }) => {
      const [dbUser] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.userId))
        .limit(1);
      return {
        role: dbUser?.role,
        user: {
          ...sessionUser,
          role: dbUser?.role,
        },
        session,
      };
    }),
  ],
});

export type AuthUser = InferSelectModel<typeof user>;
