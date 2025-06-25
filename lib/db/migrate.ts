// Attempt to load .env.local before other imports
import { join } from 'path';
import { existsSync }
from 'fs';

// Adjusted path for dotenv
const dotenvPath = join(process.cwd(), '.env.local');
if (existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  // Fallback for environments where .env.local might not be at process.cwd()
  // This might happen in some deployment or build scenarios.
  // For local dev, process.cwd() should be /app
  try {
    require('dotenv').config({ path: join(__dirname, '..', '..', '.env.local')});
  } catch (e) {
    console.warn("Could not load .env.local from process.cwd() or relative to script.");
  }
}


import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// config({
// path: '.env.local',
// });

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations...');

  const start = Date.now();
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  const end = Date.now();

  console.log('✅ Migrations completed in', end - start, 'ms');
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
