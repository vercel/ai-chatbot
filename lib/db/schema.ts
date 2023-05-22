import {
  integer,
  timestamp,
  pgTable,
  text,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { ProviderType } from "@auth/nextjs/providers";

export const users = pgTable(
  "users",
  {
    id: text("id").notNull().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
  },
  (user) => ({
    emailKey: uniqueIndex("User_email_key").on(user.email),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<ProviderType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => {
    return {
      providerProviderAccountIdKey: uniqueIndex(
        "Account_provider_providerAccountId_key"
      ).on(table.provider, table.providerAccountId),
    };
  }
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => {
    return {
      sessionTokenKey: uniqueIndex("Session_sessionToken_key").on(
        table.sessionToken
      ),
    };
  }
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    identifierTokenKey: uniqueIndex(
      "VerificationToken_identifier_token_key"
    ).on(table.identifier, table.token),
    tokenKey: uniqueIndex("VerificationToken_token_key").on(table.token),
  })
);

// Connect to Vercel Postgres
export const db = drizzle(sql);

export type DbClient = typeof db;

export type Schema = {
  users: typeof users;
  accounts: typeof accounts;
  sessions: typeof sessions;
  verificationTokens: typeof verificationTokens;
};
// import { sql, eq, and } from "drizzle-orm";
// import {
//   PgDatabase,
//   QueryResultHKT,
//   integer,
//   pgTable,
//   text,
//   timestamp,
//   uniqueIndex,
//   uuid,
// } from "drizzle-orm/pg-core";
// import { drizzle } from "drizzle-orm/vercel-postgres";
// import { sql as c } from "@vercel/postgres";
// import { Adapter, AdapterUser } from "@auth/nextjs/adapters";

// export const db = drizzle(c);

// export const users = pgTable(
//   "users",
//   {
//     id: uuid("id")
//       .notNull()
//       .primaryKey()
//       .default(sql`gen_random_uuid()`),
//     name: text("name"),
//     email: text("email"),
//     emailVerified: timestamp("emailVerified", { precision: 3 }),
//     image: text("image"),
//   },
//   (table) => {
//     return {
//       emailKey: uniqueIndex("User_email_key").on(table.email),
//     };
//   }
// );

// export const verificationTokens = pgTable(
//   "verification_tokens",
//   {
//     identifier: text("identifier").notNull(),
//     token: text("token").notNull(),
//     expires: timestamp("expires", { precision: 3 }).notNull(),
//   },
//   (table) => {
//     return {
//       identifierTokenKey: uniqueIndex(
//         "VerificationToken_identifier_token_key"
//       ).on(table.identifier, table.token),
//       tokenKey: uniqueIndex("VerificationToken_token_key").on(table.token),
//     };
//   }
// );

// export const sessions = pgTable(
//   "sessions",
//   {
//     id: uuid("id")
//       .notNull()
//       .primaryKey()
//       .default(sql`gen_random_uuid()`),
//     sessionToken: text("sessionToken").notNull(),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     expires: timestamp("expires", { precision: 3 }).notNull(),
//   },
//   (table) => {
//     return {
//       sessionTokenKey: uniqueIndex("Session_sessionToken_key").on(
//         table.sessionToken
//       ),
//     };
//   }
// );

// export const accounts = pgTable(
//   "accounts",
//   {
//     id: uuid("id")
//       .notNull()
//       .primaryKey()
//       .default(sql`gen_random_uuid()`),
//     userId: uuid("userId")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
//     type: text("type").notNull(),
//     provider: text("provider").notNull(),
//     providerAccountId: text("providerAccountId").notNull(),
//     refresh_token: text("refresh_token"),
//     access_token: text("access_token"),
//     expires_at: integer("expires_at"),
//     token_type: text("token_type"),
//     scope: text("scope"),
//     id_token: text("id_token"),
//     session_state: text("session_state"),
//   },
//   (table) => {
//     return {
//       providerProviderAccountIdKey: uniqueIndex(
//         "Account_provider_providerAccountId_key"
//       ).on(table.provider, table.providerAccountId),
//     };
//   }
// );

// type Users = typeof users;
// type Sessions = typeof sessions;
// type Accounts = typeof accounts;
// type VerificationTokens = typeof verificationTokens;

// export function DrizzleAdapter<
//   T extends PgDatabase<U>,
//   U extends QueryResultHKT
// >({
//   db,
//   schema,
// }: {
//   db: T;
//   schema: {
//     users: Users;
//     sessions: Sessions;
//     accounts: Accounts;
//     verificationTokens: VerificationTokens;
//   };
// }): Adapter {
//   return {
//     async createUser(user) {
//       const [newUser] = await db.insert(schema.users).values(user).returning();

//       return newUser as AdapterUser;
//     },
//     async getUser(id) {
//       const [user] = await db
//         .select()
//         .from(schema.users)
//         .where(eq(schema.users.id, id));

//       return (user as AdapterUser) || null;
//     },
//     async getUserByEmail(email) {
//       const [user] = await db
//         .select()
//         .from(schema.users)
//         .where(eq(schema.users.email, email));

//       return (user as AdapterUser) || null;
//     },
//     async getUserByAccount({ providerAccountId, provider }) {
//       const results = await db
//         .select()
//         .from(schema.users)
//         .leftJoin(schema.accounts, eq(schema.accounts.userId, schema.users.id))
//         .where(
//           and(
//             eq(schema.accounts.provider, provider),
//             eq(schema.accounts.providerAccountId, providerAccountId)
//           )
//         );

//       if (results.length) {
//         return results[0].users as AdapterUser;
//       }

//       return null;
//     },
//     async updateUser(user) {
//       const userId = user.id;

//       if (!userId) {
//         throw new Error("Cannot update user without id");
//       }

//       const [updatedUser] = await db
//         .update(schema.users)
//         .set(user)
//         .where(eq(schema.users.id, userId))
//         .returning();

//       return updatedUser as AdapterUser;
//     },
//     async deleteUser(userId) {
//       await db.delete(schema.users).where(eq(schema.users.id, userId));
//     },
//     async linkAccount(account) {
//       await db.insert(schema.accounts).values(account);
//     },
//     async unlinkAccount({ providerAccountId, provider }) {
//       await db
//         .delete(schema.accounts)
//         .where(
//           and(
//             eq(schema.accounts.provider, provider),
//             eq(schema.accounts.providerAccountId, providerAccountId)
//           )
//         );
//     },
//     async createSession(session) {
//       const [newSession] = await db
//         .insert(schema.sessions)
//         .values(session)
//         .returning();

//       return newSession;
//     },
//     async getSessionAndUser(sessionToken) {
//       const results = await db
//         .select()
//         .from(schema.sessions)
//         .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
//         .where(eq(schema.sessions.sessionToken, sessionToken));

//       if (results.length) {
//         return {
//           user: results[0].users! as AdapterUser,
//           session: results[0].sessions,
//         };
//       }

//       return null;
//     },
//     async updateSession(session) {
//       const [updatedSession] = await db
//         .update(schema.sessions)
//         .set(session)
//         .where(eq(schema.sessions.sessionToken, session.sessionToken))
//         .returning();

//       return updatedSession;
//     },
//     async deleteSession(sessionToken) {
//       await db
//         .delete(schema.sessions)
//         .where(eq(schema.sessions.sessionToken, sessionToken));
//     },
//     async createVerificationToken(token) {
//       const [newVerificationToken] = await db
//         .insert(schema.verificationTokens)
//         .values(token)
//         .returning();

//       return newVerificationToken;
//     },
//     async useVerificationToken({ identifier, token }) {
//       const [deletedVerificationToken] = await db
//         .delete(schema.verificationTokens)
//         .where(
//           and(
//             eq(schema.verificationTokens.identifier, identifier),
//             eq(schema.verificationTokens.token, token)
//           )
//         )
//         .returning();

//       return deletedVerificationToken || null;
//     },
//   };
// }
