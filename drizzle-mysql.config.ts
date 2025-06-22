import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.local',
});

export default defineConfig({
  schema: './lib/db/f3/schema.ts',
  out: './lib/db/f3/migrations',
  dialect: 'mysql',
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.MYSQL_URL!,
  },
  introspect: {
    casing: 'camel',
  },
});
