# Vector Search Implementation Checklist

This checklist helps you verify that all the necessary components for vector search are working correctly.

## Prerequisites

- [ ] PostgreSQL database with pgvector extension
- [ ] Required dependencies in package.json
- [ ] Database migrations applied

## Database Setup Verification

Run these SQL commands to check your setup:

```sql
-- Check if pgvector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if the embeddingVector column exists in the KnowledgeChunk table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'KnowledgeChunk' AND column_name = 'embeddingVector';

-- Check if any vectors have been stored
SELECT COUNT(*) 
FROM "KnowledgeChunk" 
WHERE "embeddingVector" IS NOT NULL 
  AND "embeddingVector" != '{}'::vector;
```

## Code Verification

1. Check that vector types are correctly defined in `schema.ts`:
   - The embeddingVector column should be defined with `vector(1536).notNull().default([])`

2. Check that `createKnowledgeChunk` in `queries.ts` properly handles both embedding formats:
   - Regular embedding as string for backward compatibility
   - embeddingVector for vector search

3. Verify that searches in `localSearch.ts` and `queries.ts` are using the correct column name:
   - All references should use `"embeddingVector"` instead of `embedding_vector`

## Testing Vector Search

1. Add a new document to the knowledge base
2. Run a search that should match that document
3. Monitor the logs to verify:
   - The vector search is being attempted
   - No errors about missing columns or types
   - The search results include the expected document

## Common Issues and Solutions

1. **"Cannot read properties of undefined (reading 'dimensions')"**
   - This usually means the vector type is not properly initialized in drizzle
   - Solution: Make sure to provide proper dimension value (1536) and default value

2. **"type vector does not exist"**
   - The pgvector extension is not installed in the database
   - Solution: Run `CREATE EXTENSION vector;` in your database

3. **Type mismatches between string and number[]**
   - Verify the types in function parameters match the actual values being passed
   - Store embeddings as string in the text field, but as number[] in the vector field

4. **Field name mismatches**
   - Verify consistent naming between schema definitions and SQL queries
   - Use camelCase in TS code (embeddingVector) and proper quotes in SQL ("embeddingVector")
