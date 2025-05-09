require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { up } = require('./lib/db/migrations/system-settings-migration.cjs');

async function main() {
  try {
    console.log('Connecting to database...');
    const client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    console.log('Running SystemSettings migration...');
    await up(db);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Migration script error:', error);
  process.exit(1);
});
