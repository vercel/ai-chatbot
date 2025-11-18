/**
 * Database schema definitions using Drizzle ORM.
 * 
 * All tables and columns use snake_case naming convention.
 * This schema supports AI SDK 5 message parts format.
 * 
 * @module lib/db/schema
 */

import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  firstname: text("firstname"),
  lastname: text("lastname"),
  avatar_url: text("avatar_url"),
  job_title: text("job_title"),
  ai_context: text("ai_context"),
  proficiency: text("proficiency"),
  ai_tone: text("ai_tone"),
  ai_guidance: text("ai_guidance"),
  onboarding_completed: boolean("onboarding_completed").notNull().default(false),
});

export type User = InferSelectModel<typeof user>;

export const workspace = pgTable("workspaces", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug"),
  owner_user_id: uuid("owner_user_id").references(() => user.id),
  mode: text("mode").notNull().default("hosted"),
  avatar_url: text("avatar_url"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Workspace = InferSelectModel<typeof workspace>;

export const role = pgTable(
  "roles",
  {
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    level: integer("level").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspace_id, table.id] }),
  })
);

export type Role = InferSelectModel<typeof role>;

export const team = pgTable("teams", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Team = InferSelectModel<typeof team>;

export const workspaceUser = pgTable("workspace_users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  user_id: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role_id: text("role_id").notNull(),
  team_id: uuid("team_id").references(() => team.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  roleReference: foreignKey({
    columns: [table.workspace_id, table.role_id],
    foreignColumns: [role.workspace_id, role.id],
  }),
}));

export type WorkspaceUser = InferSelectModel<typeof workspaceUser>;

export const workspaceInvite = pgTable("workspace_invites", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  roles: text("roles").array().notNull(),
  invited_by: uuid("invited_by")
    .notNull()
    .references(() => user.id),
  email: text("email"),
  user_id: uuid("user_id").references(() => user.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  accepted_at: timestamp("accepted_at", { withTimezone: true }),
});

export type WorkspaceInvite = InferSelectModel<typeof workspaceInvite>;

export const workspaceApp = pgTable("workspace_apps", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  credential_ref: text("credential_ref").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WorkspaceApp = InferSelectModel<typeof workspaceApp>;

export type PageBlockConfig = Record<string, unknown>;

export const page = pgTable("pages", {
  id: text("id").primaryKey().notNull(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  layout: jsonb("layout")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  blocks: jsonb("blocks")
    .$type<PageBlockConfig[]>()
    .notNull()
    .default([]),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  created_by: uuid("created_by").references(() => user.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Page = InferSelectModel<typeof page>;

export type TableConfig = Record<string, unknown>;

export const table = pgTable("tables", {
  id: text("id").primaryKey().notNull(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  config: jsonb("config")
    .$type<TableConfig>()
    .notNull()
    .default({}),
  created_by: uuid("created_by").references(() => user.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Table = InferSelectModel<typeof table>;

export const chat = pgTable("chats", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  created_at: timestamp("created_at").notNull(),
  title: text("title").notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  last_context: jsonb("last_context").$type<AppUsage | null>(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("messages", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chat_id: uuid("chat_id")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  created_at: timestamp("created_at").notNull(),
  workspace_id: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "votes",
  {
    chat_id: uuid("chat_id")
      .notNull()
      .references(() => chat.id),
    message_id: uuid("message_id")
      .notNull()
      .references(() => message.id),
    is_upvoted: boolean("is_upvoted").notNull(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chat_id, table.message_id] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "documents",
  {
    id: uuid("id").notNull().defaultRandom(),
    created_at: timestamp("created_at").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    user_id: uuid("user_id")
      .notNull()
      .references(() => user.id),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.created_at] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "suggestions",
  {
    id: uuid("id").notNull().defaultRandom(),
    document_id: uuid("document_id").notNull(),
    document_created_at: timestamp("document_created_at").notNull(),
    original_text: text("original_text").notNull(),
    suggested_text: text("suggested_text").notNull(),
    description: text("description"),
    is_resolved: boolean("is_resolved").notNull().default(false),
    user_id: uuid("user_id")
      .notNull()
      .references(() => user.id),
    created_at: timestamp("created_at").notNull(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.document_id, table.document_created_at],
      foreignColumns: [document.id, document.created_at],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "streams",
  {
    id: uuid("id").notNull().defaultRandom(),
    chat_id: uuid("chat_id").notNull(),
    created_at: timestamp("created_at").notNull(),
    workspace_id: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chat_id],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;
