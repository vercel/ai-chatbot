#!/usr/bin/env node

// Load environment variables
const { config } = require('dotenv');
config({ path: '.env.local' });
config({ path: '.env' });

const {
  up,
} = require('./lib/db/migrations/add-unique-constraint-to-document-id.cjs');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function runDocumentUniqueIdMigration() {
  let client;
  try {
    console.log('Running Document.id UNIQUE constraint migration...');

    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    await up(db);

    console.log(
      'Document.id UNIQUE constraint migration completed successfully!',
    );
    process.exit(0);
  } catch (error) {
    console.error('Document.id UNIQUE constraint migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

process.on('unhandledRejection', (error) => {
  console.error('Migration script error (unhandledRejection):', error);
  process.exit(1);
});

runDocumentUniqueIdMigration();
