# Vector Search Disabled

## Emergency Fix

We've temporarily disabled vector search in the knowledge base due to compatibility issues with pgVector in Drizzle ORM. The error was:

```
TypeError: Cannot read properties of undefined (reading 'dimensions')
```

This was causing the entire application to crash when trying to access pages that need the schema definition.

## Changes Made

1. **Removed Vector Column**:
   - Removed the `embeddingVector` column from the schema
   - This eliminates the dependency on the pgVector type that was causing errors

2. **Simplified Embedding Storage**:
   - Now only using text-based storage for embeddings
   - All embeddings are stored as JSON strings in the `embedding` column

3. **Updated Search Logic**:
   - Changed the search to use text matching instead of vector similarity
   - Implemented fallbacks to ensure results are always returned

4. **Improved Stability**:
   - Application should now run without crashing
   - Search still works, though with reduced relevance accuracy

## Search Performance

With vector search disabled, search results will be less accurate than before. The current implementation:

1. Tries to match query terms directly in the content text
2. Falls back to returning the most recent documents if no matches

## Next Steps

For a proper fix in the future, we need to:

1. Investigate why pgVector is not working with the current configuration
2. Test pgVector in a controlled environment to identify compatibility issues
3. Update dependencies if needed
4. Re-implement vector search once the issues are resolved

For now, this emergency fix should keep the application running smoothly.
