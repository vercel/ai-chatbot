// // // lib/db/schema.ts - Fixed version with consistent snake_case naming
// import type { InferSelectModel } from 'drizzle-orm';
// import {
//   pgTable,
//   varchar,
//   timestamp,
//   json,
//   uuid,
//   text,
//   primaryKey,
//   boolean,
// } from 'drizzle-orm/pg-core';

// // User table with consistent snake_case column naming
// export const user = pgTable('User', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   email: varchar('email', { length: 64 }).notNull().unique(),
//   password: varchar('password', { length: 64 }), // Nullable for OAuth users
//   name: varchar('name', { length: 64 }),
//   image: varchar('image', { length: 255 }),
//   email_verified: boolean('email_verified').default(false).notNull(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
//   updated_at: timestamp('updated_at').defaultNow().notNull(),
// });

// export type User = InferSelectModel<typeof user>;

// // Email Verification Tokens table
// export const emailVerificationTokens = pgTable('email_verification_tokens', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
//   token: text('token').notNull(),
//   expires_at: timestamp('expires_at').notNull(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
// });

// export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;

// // Password Reset Token table
// export const passwordResetTokens = pgTable('password_reset_tokens', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
//   token: text('token').notNull(),
//   expires_at: timestamp('expires_at').notNull(),
//   created_at: timestamp('created_at').defaultNow().notNull(),
// });

// export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;

// // Chat table - using snake_case consistently
// export const chat = pgTable('Chat', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   created_at: timestamp('created_at').notNull().defaultNow(),
//   title: text('title').notNull(),
//   user_id: uuid('user_id')
//     .notNull()
//     .references(() => user.id),
//   visibility: varchar('visibility', { enum: ['public', 'private'] })
//     .notNull()
//     .default('private'),
// });

// export type Chat = InferSelectModel<typeof chat>;

// // DEPRECATED: The following schema is deprecated and will be removed in the future.
// export const messageDeprecated = pgTable('Message', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   chat_id: uuid('chat_id')
//     .notNull()
//     .references(() => chat.id),
//   role: varchar('role').notNull(),
//   content: json('content').notNull(),
//   created_at: timestamp('created_at').notNull().defaultNow(),
// });

// export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

// // Current message table with snake_case
// export const message = pgTable('Message_v2', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   chat_id: uuid('chat_id')
//     .notNull()
//     .references(() => chat.id),
//   role: varchar('role').notNull(),
//   parts: json('parts').notNull(),
//   attachments: json('attachments').notNull(),
//   created_at: timestamp('created_at').notNull().defaultNow(),
// });

// export type DBMessage = InferSelectModel<typeof message>;

// // DEPRECATED: The following schema is deprecated and will be removed in the future.
// export const voteDeprecated = pgTable(
//   'Vote',
//   {
//     chat_id: uuid('chat_id')
//       .notNull()
//       .references(() => chat.id),
//     message_id: uuid('message_id')
//       .notNull()
//       .references(() => messageDeprecated.id),
//     is_upvoted: boolean('is_upvoted').notNull(),
//   },
//   (table) => {
//     return {
//       pk: primaryKey({ columns: [table.chat_id, table.message_id] }),
//     };
//   },
// );

// export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

// // Current vote table with snake_case
// export const vote = pgTable(
//   'Vote_v2',
//   {
//     chat_id: uuid('chat_id')
//       .notNull()
//       .references(() => chat.id),
//     message_id: uuid('message_id')
//       .notNull()
//       .references(() => message.id),
//     is_upvoted: boolean('is_upvoted').notNull(),
//   },
//   (table) => {
//     return {
//       pk: primaryKey({ columns: [table.chat_id, table.message_id] }),
//     };
//   },
// );

// export type Vote = InferSelectModel<typeof vote>;

// // Document table with snake_case
// export const document = pgTable('Document', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   created_at: timestamp('created_at').notNull().defaultNow(),
//   title: text('title').notNull(),
//   content: text('content'),
//   kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet'] })
//     .notNull()
//     .default('text'),
//   user_id: uuid('user_id')
//     .notNull()
//     .references(() => user.id),
// });

// export type Document = InferSelectModel<typeof document>;

// // Suggestion table with snake_case
// export const suggestion = pgTable('Suggestion', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   document_id: uuid('document_id')
//     .notNull()
//     .references(() => document.id),
//   document_created_at: timestamp('document_created_at').notNull(),
//   original_text: text('original_text').notNull(),
//   suggested_text: text('suggested_text').notNull(),
//   description: text('description'),
//   is_resolved: boolean('is_resolved').notNull().default(false),
//   user_id: uuid('user_id')
//     .notNull()
//     .references(() => user.id),
//   created_at: timestamp('created_at').notNull().defaultNow(),
// });

// export type Suggestion = InferSelectModel<typeof suggestion>;

// // Legacy type exports for backward compatibility
// export type NewUser = typeof user.$inferInsert;


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
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull().unique(),
  password: varchar('password', { length: 64 }), // Nullable for OAuth users
  name: varchar('name', { length: 64 }),
  image: varchar('image', { length: 255 }),
  email_verified: boolean('email_verified').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type User = InferSelectModel<typeof user>;

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;

// Password Reset Token table
export const passwordResetToken = pgTable('PasswordResetToken', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type PasswordResetToken = InferSelectModel<typeof passwordResetToken>;


// Chat table - using snake_case consistently
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

// Current message table with snake_case
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

// Current vote table with snake_case
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

// Document table with snake_case
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

// Suggestion table with snake_case
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


