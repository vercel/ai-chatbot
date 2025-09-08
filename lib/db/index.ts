import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Create a singleton database connection
const client = postgres(process.env.POSTGRES_URL);
export const db = drizzle(client);