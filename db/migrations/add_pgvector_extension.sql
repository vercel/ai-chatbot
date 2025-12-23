-- Migration: Add pgvector extension for TiQology Vector DB
-- Replaces: Pinecone ($70/mo)
-- Created: 2025-12-22

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding size (can be changed)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS embeddings_user_id_idx ON embeddings(user_id);
CREATE INDEX IF NOT EXISTS embeddings_created_at_idx ON embeddings(created_at DESC);

-- Create vector index for fast similarity search
-- Using IVFFlat algorithm for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx 
ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create search function
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata,
    e.created_at
  FROM embeddings e
  WHERE (filter_user_id IS NULL OR e.user_id = filter_user_id)
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create insert function with automatic timestamp
CREATE OR REPLACE FUNCTION insert_embedding(
  p_user_id UUID,
  p_content TEXT,
  p_embedding VECTOR(1536),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO embeddings (user_id, content, embedding, metadata)
  VALUES (p_user_id, p_content, p_embedding, p_metadata)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embeddings_updated_at
BEFORE UPDATE ON embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own embeddings
CREATE POLICY "Users can view their own embeddings"
ON embeddings FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own embeddings
CREATE POLICY "Users can insert their own embeddings"
ON embeddings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own embeddings
CREATE POLICY "Users can update their own embeddings"
ON embeddings FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own embeddings
CREATE POLICY "Users can delete their own embeddings"
ON embeddings FOR DELETE
USING (auth.uid() = user_id);

-- Create service role policy (for backend operations)
CREATE POLICY "Service role has full access"
ON embeddings
USING (auth.role() = 'service_role');

-- Performance: Add statistics for query planner
ANALYZE embeddings;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ pgvector extension enabled successfully!';
  RAISE NOTICE '✅ embeddings table created';
  RAISE NOTICE '✅ Vector index created (IVFFlat)';
  RAISE NOTICE '✅ Search function created';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '💰 Pinecone replacement complete - $70/mo saved!';
END $$;
