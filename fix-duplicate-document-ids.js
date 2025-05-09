#!/usr/bin/env node

// Load environment variables
const { config } = require('dotenv');
config({ path: '.env.local' });
config({ path: '.env' });

const { drizzle } = require('drizzle-orm/postgres-js');
const { sql } = require('drizzle-orm');
const postgres = require('postgres');
const crypto = require('node:crypto');

async function fixDuplicateDocumentIds() {
  let client;
  try {
    console.log('Identifying and fixing duplicate Document IDs...');

    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    // Find all duplicate IDs
    const duplicates = await db.execute(sql`
      SELECT id, COUNT(*) as count
      FROM "Document"
      GROUP BY id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicates.length === 0) {
      console.log('No duplicate IDs found in the Document table.');
      return;
    }

    console.log(
      `Found ${duplicates.length} duplicate IDs in the Document table.`,
    );

    // Process each set of duplicates
    for (const dup of duplicates) {
      const id = dup.id;
      console.log(`Processing duplicate ID: ${id} (${dup.count} occurrences)`);

      // Get all records with this ID, ordered by creation date
      const records = await db.execute(sql`
        SELECT id, "createdAt", title 
        FROM "Document" 
        WHERE id = ${id}
        ORDER BY "createdAt" DESC
      `);

      console.log(`  Records with ID ${id}:`);
      records.forEach((r, i) => {
        console.log(`  ${i + 1}. Title: "${r.title}", Created: ${r.createdAt}`);
      });

      // Keep the newest record (index 0) and update all others with new UUIDs
      for (let i = 1; i < records.length; i++) {
        const newId = crypto.randomUUID();
        console.log(`  Updating record ${i + 1} with new ID: ${newId}`);

        await db.execute(sql`
          UPDATE "Document"
          SET id = ${newId}
          WHERE id = ${id} AND "createdAt" = ${records[i].createdAt}
        `);
      }
    }

    console.log('All duplicate Document IDs have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix duplicate Document IDs:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

process.on('unhandledRejection', (error) => {
  console.error('Script error (unhandledRejection):', error);
  process.exit(1);
});

fixDuplicateDocumentIds();
