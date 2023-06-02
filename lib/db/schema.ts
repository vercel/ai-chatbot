import { sql } from "@vercel/postgres";
import { pgTable, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";

// const connection = createPool({ connectionString: process.env.POSTGRES_URL });

export const chats = pgTable("chats", {
  id: text("id").notNull().primaryKey(),
  title: text("role").notNull(),
  userId: text("userId").notNull(),
  // messages: json("messages").notNull().default({}),
  // .references(() => users.id),
});

// export const messages = pgTable("messages", {
//   id: text("id").notNull().primaryKey(),
//   title: text("role").notNull(),
//   chatId: text("chatId")
//     .notNull()
//     .references(() => chats.id),
// });

// export const chatsRelations = relations(chats, ({ many }) => ({
//   // user: one(users, {
//   //   fields: [chats.userId],
//   //   references: [users.id],
//   // }),
//   messages: many(messages),
// }));

// export const messagesRelations = relations(messages, ({ one }) => ({
//   chat: one(chats, {
//     fields: [messages.chatId],
//     references: [chats.id],
//   }),
// }));

export const db = drizzle(sql, {
  schema: {
    // users,
    // accounts,
    // sessions,
    // verificationTokens,
    chats,
    // chatsRelations,
    // messages,
    // messagesRelations,
    // usersRelations,
  },
});

export type DbClient = typeof db;

export type Schema = {
  chats: typeof chats;
};
