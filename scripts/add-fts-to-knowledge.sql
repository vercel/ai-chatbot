-- Migration to add full-text search capabilities to the knowledge chunks

-- Add a column for the tsvector (text search vector)
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS content_tsv tsvector;

-- Create an index for fast full-text search (GIN index is recommended for tsvector)
CREATE INDEX IF NOT EXISTS knowledge_chunk_content_tsv_idx ON "KnowledgeChunk" USING GIN(content_tsv);

-- Update existing data to populate the tsvector column
UPDATE "KnowledgeChunk" SET content_tsv = to_tsvector('english', content);

-- Create a function to automatically update the tsvector when content changes
CREATE OR REPLACE FUNCTION knowledge_chunk_trigger() RETURNS trigger AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Add a trigger to automatically update tsvector when content is inserted or updated
DROP TRIGGER IF EXISTS knowledge_chunk_trigger ON "KnowledgeChunk";
CREATE TRIGGER knowledge_chunk_trigger 
BEFORE INSERT OR UPDATE OF content ON "KnowledgeChunk"
FOR EACH ROW
EXECUTE FUNCTION knowledge_chunk_trigger();

-- Add an index on documentId and userId for more efficient lookups
CREATE INDEX IF NOT EXISTS knowledge_chunk_document_user_idx 
ON "KnowledgeChunk" ("documentId") 
WHERE "documentId" IS NOT NULL;

-- Add an index on content to improve basic text search when FTS isn't applicable
CREATE INDEX IF NOT EXISTS knowledge_chunk_content_idx 
ON "KnowledgeChunk" (content);

-- Add an index to improve join performance when searching
CREATE INDEX IF NOT EXISTS knowledge_document_user_idx 
ON "KnowledgeDocument" ("userId");
