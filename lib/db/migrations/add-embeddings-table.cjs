const { sql } = require('drizzle-orm');

// Migration to add the Embeddings table and enable pgvector extension

module.exports.up = async function(db) {
  // First ensure the pgvector extension is enabled
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS vector;
  `);
  
  // Check if the Embeddings table already exists
  const tableCheck = await db.execute(sql`
    SELECT to_regclass('public.Embeddings') IS NOT NULL as exists;
  `);
  
  if (!tableCheck[0].exists) {
    // Create the Embeddings table
    await db.execute(sql`
      CREATE TABLE "Embeddings" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "resourceId" uuid NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "embedding" vector(1536) NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    // Create an HNSW index for faster similarity search
    await db.execute(sql`
      CREATE INDEX "embeddingIndex" ON "Embeddings"
      USING hnsw (embedding vector_cosine_ops);
    `);

    console.log('Migration: Created Embeddings table with HNSW index.');
  } else {
    console.log('Migration: Embeddings table already exists.');
  }
};

module.exports.down = async function(db) {
  // Drop the table if it exists
  await db.execute(sql`
    DROP TABLE IF EXISTS "Embeddings";
  `);
  // Note: Dropping the extension is usually not done in a rollback 
  // unless you are sure no other parts of the DB use it.
  // await db.execute(sql`DROP EXTENSION IF EXISTS vector;`);
  console.log('Rollback: Dropped Embeddings table.');
}; 