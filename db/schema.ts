import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  timestamp, 
  json, 
  uuid, 
  boolean, 
  index,
  jsonb,
  text,
  integer
} from "drizzle-orm/pg-core";

// User table with additional fields and indexes
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  password: varchar("password", { length: 64 }),
  name: varchar("name", { length: 100 }),
  avatar: varchar("avatar", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  lastLoginAt: timestamp("lastLoginAt"),
  isActive: boolean("isActive").notNull().default(true),
  deletedAt: timestamp("deletedAt"),
  settings: jsonb("settings").default({}).notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
}));

export type User = InferSelectModel<typeof user>;

// Chat settings type
export type ChatSettings = {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  maxTokens?: number;
};

// Chat table with additional fields and indexes
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  lastMessageAt: timestamp("lastMessageAt"),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  isArchived: boolean("isArchived").notNull().default(false),
  deletedAt: timestamp("deletedAt"),
  settings: jsonb("settings").$type<ChatSettings>().default({}).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  lastMessageAtIdx: index("last_message_at_idx").on(table.lastMessageAt),
  deletedAtIdx: index("chat_deleted_at_idx").on(table.deletedAt),
}));

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

// Message type with metadata
export type ChatMessage = Message & {
  metadata?: {
    tokens?: number;
    processingTime?: number;
    model?: string;
    error?: string;
  };
};

/* Added new table for PDF uploads */

export const pdfUploads = pgTable('PDFUploads', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  url: text('url').notNull(),
  mimeType: text('mimeType').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
