import { Message } from "ai";
import { InferSelectModel, relations } from "drizzle-orm";
import { pgTable, varchar, timestamp, json, uuid, primaryKey } from "drizzle-orm/pg-core";

export const organisation = pgTable("Organisation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(),
  country: varchar("country", { length: 64 }).notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
});

export type Organisation = InferSelectModel<typeof organisation>;

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  organisation_id: uuid("organisationId"),
  email: varchar("email", { length: 64 }),
  email: varchar("email", { length: 64 }).notNull(),
});

export type User = InferSelectModel<typeof user>;

export const organisationRelations = relations(organisation, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one }) => ({
  organisation: one(organisation, {
    fields: [posts.organisationId],
    references: [organisation.id],
  }),
}));

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};
