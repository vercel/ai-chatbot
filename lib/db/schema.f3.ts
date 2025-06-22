import {
  timestamp,
  date,
  varchar,
  integer,
  text,
  uuid,
  pgSchema,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

const f3Schema = pgSchema('f3');

export const backblast = f3Schema.table('Backblast', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  sk: varchar('sk', { length: 255 }).unique().notNull(),
  ingestedAt: timestamp('ingestedAt').notNull().defaultNow(),
  date: date('date').notNull(),
  ao: varchar('ao', { length: 64 }).notNull(),
  q: varchar('q', { length: 64 }).notNull(),
  pax_count: integer('pax_count').notNull(),
  fngs: varchar('fngs', { length: 255 }).notNull(),
  fng_count: integer('fng_count').notNull(),
  backblast: text('backblast').notNull(),
});

export type Backblast = InferSelectModel<typeof backblast>;
