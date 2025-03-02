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
  index,
  vector,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

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

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
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

// Knowledge Base tables
export const knowledgeDocument = pgTable('KnowledgeDocument', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  description: text('description'),
  sourceType: varchar('sourceType', { 
    enum: ['pdf', 'text', 'url', 'audio', 'video', 'youtube']
  }).notNull(),
  sourceUrl: text('sourceUrl'),
  fileSize: varchar('fileSize', { length: 20 }),
  fileType: varchar('fileType', { length: 50 }),
  status: varchar('status', { 
    enum: ['processing', 'completed', 'failed']
  }).notNull().default('processing'),
  processingError: text('processingError'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type KnowledgeDocument = InferSelectModel<typeof knowledgeDocument>;

export const knowledgeChunk = pgTable('KnowledgeChunk', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  documentId: uuid('documentId')
    .notNull()
    .references(() => knowledgeDocument.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  metadata: json('metadata'),
  chunkIndex: varchar('chunkIndex', { length: 20 }).notNull(),
  embedding: text('embedding'), // Temporarily changed from vector to text
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => {
  return {
    documentIdIdx: index('documentId_idx').on(table.documentId),
  };
});

export type KnowledgeChunk = InferSelectModel<typeof knowledgeChunk>;

export const knowledgeReference = pgTable('KnowledgeReference', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  messageId: uuid('messageId')
    .notNull()
    .references(() => message.id, { onDelete: 'cascade' }),
  chunkId: uuid('chunkId')
    .notNull()
    .references(() => knowledgeChunk.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => {
  return {
    messageChunkIdx: index('message_chunk_idx').on(table.messageId, table.chunkId),
  };
});

export type KnowledgeReference = InferSelectModel<typeof knowledgeReference>;
