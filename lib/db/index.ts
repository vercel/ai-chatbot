import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { env } from '@/env';

const client = postgres(env.POSTGRES_URL);
export const db = drizzle(client, { schema });