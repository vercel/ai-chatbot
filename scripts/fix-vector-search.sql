-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add a vector column to KnowledgeChunk table
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embeddingVector" vector(1536) NOT NULL DEFAULT '{}'::vector;

-- Convert existing text embeddings to vector type
-- The following will be run as a batch job to update all existing embeddings
-- For each embedding stored as text, convert it to a vector
UPDATE "KnowledgeChunk" 
SET "embeddingVector" = (
  -- Convert text representation of array to actual array
  STRING_TO_ARRAY(
    REPLACE(
      REPLACE(
        embedding,
        '[', '{'),
      ']', '}'),
    ',')::float[]::vector
)
WHERE embedding IS NOT NULL
AND embedding != ''
AND embedding != 'null'
AND embedding != '[]';

-- Optional: Create an index for vector search if you have many documents
CREATE INDEX IF NOT EXISTS embedding_vector_idx ON "KnowledgeChunk" USING hnsw ("embeddingVector" vector_l2_ops);

-- Display completion message
SELECT 'Vector conversion completed. ' || COUNT(*) || ' embeddings converted.' as result
FROM "KnowledgeChunk"
WHERE "embeddingVector" != '{}'::vector;
