import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const client = postgres(process.env.POSTGRES_URL as string);
export const db = drizzle(client, { schema });
