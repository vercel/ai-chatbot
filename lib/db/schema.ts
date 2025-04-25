import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import type { UIMessage } from 'ai';

export const userProfiles = pgTable('User_Profiles', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  clerkId: text('clerk_id').unique(),
  email: varchar('email'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true }).defaultNow(),
  googleRefreshToken: text('google_refresh_token'),
  pdl_person_data: jsonb('pdl_person_data'),
  pdl_org_data: jsonb('pdl_org_data'),
  person_deep_research_data: text('person_deep_research_data'),
  org_deep_research_data: text('org_deep_research_data'),
  org_website_scrape: text('org_website_scrape'),
});

export type UserProfile = InferSelectModel<typeof userProfiles>;

export const Chat = pgTable('Chat', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => userProfiles.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  title: text('title').notNull(),
  visibility: text('visibility', { enum: ['public', 'private', 'unlisted'] })
    .default('private')
    .notNull(),
});

export type DBChat = InferSelectModel<typeof Chat>;

export const chatRelations = relations(Chat, ({ many }) => ({
  messages: many(Message_v2),
}));

export const Message_v2 = pgTable('Message_v2', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chatId')
    .references(() => Chat.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role', {
    enum: ['user', 'assistant', 'system', 'tool'],
  }).notNull(),
  parts: jsonb('parts').notNull(),
  attachments: jsonb('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof Message_v2>;

export const messageRelations = relations(Message_v2, ({ one }) => ({
  chat: one(Chat, {
    fields: [Message_v2.chatId],
    references: [Chat.id],
  }),
}));

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => Chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => Message_v2.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    tags: text('tags').array(),
    modifiedAt: timestamp('modifiedAt', { withTimezone: true }).defaultNow(),
    chatId: uuid('chat_id').references(() => Chat.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
      documentChatIdIdx: index('document_chat_id_idx').on(table.chatId),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => userProfiles.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
