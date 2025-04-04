# Knowledge Retrieval Enhancement

This directory contains scripts and SQL to enhance the knowledge retrieval capabilities of the application, especially for structured content like CVs/resumes.

## Available Scripts

1. **add-fts-to-knowledge.sql**
   - SQL migration to add PostgreSQL full-text search capabilities
   - Adds tsvector column and GIN index for efficient matching
   - Sets up automatic triggers to keep the index updated

2. **apply-fts-migration.sh**
   - Bash script to apply the SQL migration to your database
   - Extracts database connection details from your .env.local file
   - Provides feedback and verification of successful migration

## How to Use

### Step 1: Apply Database Migration

```bash
# Make the script executable
chmod +x scripts/apply-fts-migration.sh

# Run the script from the project root
./scripts/apply-fts-migration.sh
```

### Step 2: Verify the Changes

After applying the migration, you can check the database to confirm it worked:

```sql
-- Connect to your PostgreSQL database
\d "KnowledgeChunk"

-- You should see the content_tsv column and an index on it
```

### Step 3: Test the Enhanced Search

Try searching your CV with various queries:
- "What was my role at [Company]?"
- "What skills do I have?"
- "How long did I work at [Company]?"

The system should now find matches even when exact keywords aren't present in your CV, using:
- Query preprocessing for extraction of key terms
- PostgreSQL full-text search for better matching
- Multiple fallback mechanisms if initial searches don't yield results

## How It Works

1. **Query Preprocessing**
   - Extracts key entities and terms from natural language queries
   - Special handling for resume/CV-specific questions
   - Converts questions like "What's my role at GeoTech?" to search terms "GeoTech role position title"

2. **Multi-Layer Search**
   - Full-text search using PostgreSQL's built-in capabilities
   - Processed query ILIKE search as first fallback
   - Original query ILIKE search as second fallback
   - Recent documents as final fallback

3. **Enhanced Ranking**
   - Higher ranking for full-text search results
   - Medium ranking for processed query matches
   - Lower ranking for generic fallback results

## Need Help?

See the documentation in the root directory: `KNOWLEDGE_SEARCH_UPGRADE.md`
