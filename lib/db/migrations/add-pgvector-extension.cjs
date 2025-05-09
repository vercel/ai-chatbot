const { sql } = require('drizzle-orm');

module.exports.up = async function(db) {
  // Check if pgvector extension already exists
  const extensionCheck = await db.execute(sql`
    SELECT * FROM pg_extension WHERE extname = 'vector';
  `);

  if (extensionCheck.length === 0) {
    // Create the pgvector extension if it doesn't exist
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS vector;
    `);
    console.log('Migration: Added pgvector extension.');
  } else {
    console.log('Migration: pgvector extension already exists.');
  }
};

module.exports.down = async function(db) {
  // Dropping the extension would affect all tables using vector columns,
  // so we just log a warning instead of actually dropping it
  console.log('Warning: Not dropping pgvector extension as it may affect other tables.');
  console.log('If you really want to drop it, run: DROP EXTENSION vector;');
}; 