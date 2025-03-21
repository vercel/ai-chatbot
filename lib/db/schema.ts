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
}, (table) => {
  return {
    // Add index for faster chat message retrieval
    chatIdIdx: index('chat_id_idx').on(table.chatId),
    // Add index for faster message sorting by creation time
    createdAtIdx: index('message_created_at_idx').on(table.chatId, table.createdAt),
  };
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
      // Add index for faster document retrieval by user
      userIdIdx: index('document_user_id_idx').on(table.userId),
      // Add index for faster document sorting by creation time
      createdAtIdx: index('document_created_at_idx').on(table.createdAt),
      // Add index for document type filtering
      kindIdx: index('document_kind_idx').on(table.kind),
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
  embedding: text('embedding'), // Store embeddings as JSON string
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

// Tasks Management tables
export const taskProject = pgTable('task_project', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: varchar('color', { length: 20 }).notNull().default('#808080'),
  isDefault: boolean('isDefault').notNull().default(false),
  isDeleted: boolean('isDeleted').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type TaskProject = InferSelectModel<typeof taskProject>;

export const taskItem = pgTable('task_item', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  projectId: uuid('projectId')
    .notNull()
    .references(() => taskProject.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  priority: varchar('priority', { enum: ['p1', 'p2', 'p3', 'p4'] }).notNull().default('p4'),
  dueDate: varchar('dueDate', { length: 50 }),
  isDeleted: boolean('isDeleted').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => {
  return {
    projectIdIdx: index('project_id_idx').on(table.projectId),
    userIdIdx: index('user_id_idx').on(table.userId),
  };
});

export type TaskItem = InferSelectModel<typeof taskItem>;

export const taskLabel = pgTable('task_label', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: varchar('color', { length: 20 }).notNull().default('#808080'),
  isDeleted: boolean('isDeleted').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type TaskLabel = InferSelectModel<typeof taskLabel>;

export const taskItemLabel = pgTable('task_item_label', {
  taskId: uuid('taskId')
    .notNull()
    .references(() => taskItem.id, { onDelete: 'cascade' }),
  labelId: uuid('labelId')
    .notNull()
    .references(() => taskLabel.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.taskId, table.labelId] }),
    taskIdIdx: index('task_id_idx').on(table.taskId),
    labelIdIdx: index('label_id_idx').on(table.labelId),
  };
});

export type TaskItemLabel = InferSelectModel<typeof taskItemLabel>;
