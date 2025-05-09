#!/usr/bin/env node

// Load environment variables
const { config } = require('dotenv');
config({ path: '.env.local' });
config({ path: '.env' });

const { up } = require('./lib/db/migrations/add-embeddings-table.cjs');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function runEmbeddingsMigration() {
  let client;
  try {
    console.log('Running Embeddings table migration...');

    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    await up(db);

    console.log('Embeddings migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Embeddings migration failed:', error);
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

runEmbeddingsMigration();
