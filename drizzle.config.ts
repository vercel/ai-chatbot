import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { env } from '@/env';

config({
  path: '.env.local',
});

export default defineConfig({
  schema: './lib/db/schema/index.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
});
