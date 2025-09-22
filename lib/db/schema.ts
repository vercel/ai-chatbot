import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  jsonb,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  bigint,
  index,
} from 'drizzle-orm/pg-core';
import type { LanguageModelV2Usage } from '@ai-sdk/provider';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const googleCredentials = pgTable('GoogleCredentials', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  refreshToken: text('refreshToken').notNull(), // Encrypted refresh token
  accessToken: text('accessToken'), // Current access token (optional, can be refreshed)
  expiresAt: timestamp('expiresAt'), // When access token expires
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type GoogleCredentials = InferSelectModel<typeof googleCredentials>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  lastContext: jsonb('lastContext').$type<LanguageModelV2Usage | null>(),
  agentId: uuid('agentId').references(() => agent.id),
});

export type Chat = InferSelectModel<typeof chat>;

// Agents: public presets users can save and customize with a prompt
export const agent = pgTable('Agent', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  userId: uuid('userId').references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  agentPrompt: text('agentPrompt'),
  modelId: varchar('modelId', { length: 64 }),
  vectorStoreId: varchar('vectorStoreId', { length: 128 }),
  isPublic: boolean('isPublic').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Agent = InferSelectModel<typeof agent>;

export const agentVectorStoreFile = pgTable(
  'AgentVectorStoreFile',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    agentId: uuid('agentId').references(() => agent.id, {
      onDelete: 'set null',
    }),
    vectorStoreId: varchar('vectorStoreId', { length: 128 }).notNull(),
    vectorStoreFileId: varchar('vectorStoreFileId', { length: 128 })
      .notNull()
      .unique(),
    openAiFileId: varchar('openAiFileId', { length: 128 }).notNull(),
    fileName: text('fileName').notNull(),
    fileSizeBytes: bigint('fileSizeBytes', { mode: 'number' }),
    attributes: jsonb('attributes').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    vectorStoreIdIdx: index('AgentVectorStoreFile_vectorStoreId_idx').on(
      table.vectorStoreId,
    ),
    userIdIdx: index('AgentVectorStoreFile_userId_idx').on(table.userId),
  }),
);

export type AgentVectorStoreFile = InferSelectModel<
  typeof agentVectorStoreFile
>;

export const userAgent = pgTable(
  'UserAgent',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    agentId: uuid('agentId')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.agentId] }),
  }),
);

export type UserAgent = InferSelectModel<typeof userAgent>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
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
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
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
      .references(() => user.id),
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

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;
