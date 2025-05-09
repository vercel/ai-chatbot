import { pgTable, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export const systemSettings = pgTable('SystemSettings', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  allowGuestUsers: boolean('allowGuestUsers').notNull().default(true),
  allowRegistration: boolean('allowRegistration').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().default(sql`now()`),
  updatedAt: timestamp('updatedAt').notNull().default(sql`now()`),
});

// Create a default system settings record
export async function up(db: PostgresJsDatabase) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "SystemSettings" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "allowGuestUsers" boolean NOT NULL DEFAULT true,
      "allowRegistration" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  
  // Insert default settings if none exist
  await db.execute(sql`
    INSERT INTO "SystemSettings" ("allowGuestUsers", "allowRegistration")
    SELECT true, true
    WHERE NOT EXISTS (SELECT 1 FROM "SystemSettings");
  `);
}

// Remove the system settings table
export async function down(db: PostgresJsDatabase) {
  await db.execute(sql`DROP TABLE IF EXISTS "SystemSettings";`);
} 