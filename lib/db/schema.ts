/**
 * @file lib/db/schema.ts
 * @description Определения таблиц базы данных с использованием Drizzle ORM.
 * @version 2.1.0
 * @date 2025-06-12
 * @updated Поле content переведено на JSON, добавлен вид артефакта site.
 */

/** HISTORY:
 * v2.1.0 (2025-06-12): Поле content переведено на JSON и добавлен тип 'site'.
 * v2.0.0 (2025-06-09): Переименована таблица Document->Artifact, добавлены поля deletedAt и isDismissed.
 * v1.4.0 (2025-06-09): Удалена неиспользуемая таблица `stream`.
 * v1.3.0 (2025-06-07): Добавлено поле `summary` в таблицу `Document`.
*/

import type { InferSelectModel } from 'drizzle-orm'
import { boolean, foreignKey, json, pgTable, primaryKey, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core'

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
})

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
  deletedAt: timestamp('deletedAt'), // Для мягкого удаления
})

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
})

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
})

export type DBMessage = InferSelectModel<typeof message>;

export const artifact = pgTable(
  'Artifact',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: json('content').$type<string>(),
    summary: text('summary').notNull().default(''),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet', 'site'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    authorId: uuid('authorId').references(() => user.id),
    deletedAt: timestamp('deletedAt'), // Для мягкого удаления
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    }
  },
)

export type Artifact = InferSelectModel<typeof artifact>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(), // Имя поля сохранено для обратной совместимости миграций
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    isDismissed: boolean('isDismissed').notNull().default(false), // Для отклоненных предложений
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    artifactRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [artifact.id, artifact.createdAt],
    }),
  }),
)

export type Suggestion = InferSelectModel<typeof suggestion>;

// END OF: lib/db/schema.ts
