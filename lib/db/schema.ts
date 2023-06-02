import { ProviderType } from "@auth/nextjs/providers";
import { sql } from "@vercel/postgres";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";

// const connection = createPool({ connectionString: process.env.POSTGRES_URL });

export const users = pgTable("users", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified"),
  image: text("image"),
});

export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  accounts: many(accounts),
}));

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
  (account) => ({
    _: primaryKey(account.provider, account.providerAccountId),
  })
);

export const sessions = pgTable("sessions", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("sessionToken").notNull().primaryKey(),
  expires: integer("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires").notNull(),
  },
  (vt) => ({
    _: primaryKey(vt.identifier, vt.token),
  })
);

export type Schema = {
  users: typeof users;
  accounts: typeof accounts;
  sessions: typeof sessions;
  verificationTokens: typeof verificationTokens;
};

export const chats = pgTable("chats", {
  id: text("id").notNull().primaryKey(),
  title: text("role").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
});

export const chatsRelations = relations(chats, ({ one }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
}));

export const db = drizzle(sql, {
  schema: {
    users,
    accounts,
    sessions,
    verificationTokens,
    chats,
    chatsRelations,
    usersRelations,
  },
});

export type DbClient = typeof db;
