import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  customType,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  role: varchar('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
});

export type User = InferSelectModel<typeof user>;

// Provider table to store API configurations for different providers
export const provider = pgTable('Provider', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 64 }).notNull(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  apiKey: text('apiKey'),
  baseUrl: text('baseUrl'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Provider = InferSelectModel<typeof provider>;

// Provider Model table to store models for each provider
export const providerModel = pgTable('ProviderModel', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  providerId: uuid('providerId')
    .notNull()
    .references(() => provider.id),
  name: varchar('name', { length: 128 }).notNull(),
  modelId: varchar('modelId', { length: 128 }).notNull(),
  isChat: boolean('isChat').notNull().default(true),
  isImage: boolean('isImage').notNull().default(false),
  enabled: boolean('enabled').notNull().default(true),
  config: json('config'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ProviderModel = InferSelectModel<typeof providerModel>;

export const userPersona = pgTable('UserPersona', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  name: varchar('name', { length: 64 }).notNull(),
  systemMessage: text('systemMessage'),
  persona: text('persona'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  isDefault: boolean('isDefault').notNull().default(false),
});

export type UserPersona = InferSelectModel<typeof userPersona>;

export const userSettings = pgTable('UserSettings', {
  userId: uuid('userId')
    .primaryKey()
    .notNull()
    .references(() => user.id),
  temperature: json('temperature').notNull().default('0.7'),
  maxTokens: json('maxTokens'),
  topP: json('topP'),
  frequencyPenalty: json('frequencyPenalty'),
  presencePenalty: json('presencePenalty'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type UserSettings = InferSelectModel<typeof userSettings>;

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
});

export type Chat = InferSelectModel<typeof chat>;

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
    id: uuid('id').notNull().defaultRandom().unique(),
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

// Add systemSettings table to store global application settings
export const systemSettings = pgTable('SystemSettings', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  allowGuestUsers: boolean('allowGuestUsers').notNull().default(true),
  allowRegistration: boolean('allowRegistration').notNull().default(true),
  braveSearchApiKey: text('braveSearchApiKey'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type SystemSettings = InferSelectModel<typeof systemSettings>;

// Custom type for pgvector
const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]): string {
      return JSON.stringify(value);
    },
    fromDriver(value: string): number[] {
      return JSON.parse(value);
    },
  })(name);

// Resources table (can be an alias or re-evaluation of the existing Document table for RAG context)
// For now, we'll assume the existing 'document' table serves as the 'resources' table.
// If specific RAG resource fields are needed beyond what 'document' offers,
// a new 'ragResource' table could be created.

// Embeddings table to store text chunks and their vector embeddings
export const embeddings = pgTable('Embeddings', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  resourceId: uuid('resourceId') // Assuming 'document.id' is uuid
    .notNull()
    .references(() => document.id, { onDelete: 'cascade' }), // Link to the 'document' table
  content: text('content').notNull(), // The actual text chunk
  embedding: vector('embedding', 1536).notNull(), // For OpenAI text-embedding-ada-002 (1536 dimensions)
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Embedding = InferSelectModel<typeof embeddings>;
