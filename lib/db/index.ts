import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';
import { pgSchema } from 'drizzle-orm/pg-core';

// Safely check for database URL
const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('Database URL is missing! Check your environment variables.');
}

// Connect to the database
const client = postgres(databaseUrl || '');

// Set up Drizzle with the schema
export const db = drizzle(client, { schema });

// Export functions from queries.ts for convenient access
export * from './queries';
