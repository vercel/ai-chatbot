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
  unique,
} from 'drizzle-orm/pg-core';

export const organization = pgTable('Organization', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  settings: json('settings').default({}),
});

export type Organization = InferSelectModel<typeof organization>;

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  role: varchar('role', { enum: ['employee', 'compliance_officer', 'admin'] })
    .notNull()
    .default('employee'),
  organizationId: uuid('organizationId')
    .references(() => organization.id)
    .notNull(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
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
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    organizationId: uuid('organizationId')
      .notNull()
      .references(() => organization.id),
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

export const conflictReport = pgTable('ConflictReport', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userEmail: varchar('userEmail', { length: 64 }).notNull(),
  documentId: uuid('documentId').notNull(),
  content: text('content').notNull(),
  status: varchar('status', { 
    enum: ['pending', 'under_review', 'requires_more_info', 'approved', 'rejected'] 
  })
    .notNull()
    .default('pending'),
  priority: varchar('priority', { enum: ['low', 'medium', 'high', 'urgent'] })
    .notNull()
    .default('medium'),
  submittedAt: timestamp('submittedAt').notNull(),
  reviewedAt: timestamp('reviewedAt'),
  reviewerId: uuid('reviewerId').references(() => user.id),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  emailThreadId: varchar('emailThreadId', { length: 255 }), // For tracking email conversations
});

export type ConflictReport = InferSelectModel<typeof conflictReport>;

export const reviewResponse = pgTable('ReviewResponse', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  conflictReportId: uuid('conflictReportId')
    .notNull()
    .references(() => conflictReport.id),
  reviewerId: uuid('reviewerId').references(() => user.id), // Null for user responses
  actionType: varchar('actionType', {
    enum: ['acknowledge', 'request_more_info', 'approve', 'reject', 'user_response']
  }).notNull(),
  responseContent: text('responseContent').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  emailId: varchar('emailId', { length: 255 }), // Resend email ID
  isFromUser: boolean('isFromUser').notNull().default(false), // True for user email replies
});

export type ReviewResponse = InferSelectModel<typeof reviewResponse>;

export const organizationInvitation = pgTable('OrganizationInvitation', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id),
  inviterId: uuid('inviterId')
    .notNull()
    .references(() => user.id),
  role: varchar('role', { enum: ['employee', 'compliance_officer', 'admin'] })
    .notNull()
    .default('employee'),
  status: varchar('status', { enum: ['pending', 'accepted', 'expired'] })
    .notNull()
    .default('pending'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  acceptedAt: timestamp('acceptedAt'),
});

export type OrganizationInvitation = InferSelectModel<typeof organizationInvitation>;
