#!/usr/bin/env node

// Load environment variables
const { config } = require('dotenv');
config({ path: '.env.local' });
config({ path: '.env' });

const { up } = require('./lib/db/migrations/brave-search-migration.cjs');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function runMigration() {
  try {
    console.log('Running Brave Search API migration...');

    // Create database connection
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    const client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    // Run the migration
    await up(db);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Migration script error:', error);
  process.exit(1);
});

runMigration();
