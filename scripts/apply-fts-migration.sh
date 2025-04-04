#!/bin/bash

# Script to apply full-text search migration to the PostgreSQL database
# Usage: ./apply-fts-migration.sh

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Full-Text Search Migration...${NC}"

# Get database connection info from .env file
if [ -f ".env.local" ]; then
  source .env.local
  echo -e "${GREEN}Loaded environment variables from .env.local${NC}"
else
  echo -e "${RED}Error: .env.local file not found!${NC}"
  echo "Please make sure you're running this script from the project root directory."
  exit 1
fi

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
  echo -e "${RED}Error: POSTGRES_URL is not set in .env.local${NC}"
  echo "Please add POSTGRES_URL to your .env.local file."
  exit 1
fi

# Extract database name, user and password from connection string
# Format typically: postgres://username:password@host:port/database
DB_USER=$(echo $POSTGRES_URL | sed -n 's/postgres:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $POSTGRES_URL | sed -n 's/postgres:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_HOST=$(echo $POSTGRES_URL | sed -n 's/postgres:\/\/[^@]*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $POSTGRES_URL | sed -n 's/postgres:\/\/[^@]*@[^:]*:\([^/]*\).*/\1/p')
DB_NAME=$(echo $POSTGRES_URL | sed -n 's/postgres:\/\/[^@]*@[^/]*\/\([^?]*\).*/\1/p')

echo -e "${BLUE}Applying migration to database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}${NC}"

# Set PGPASSWORD environment variable for psql
export PGPASSWORD=$DB_PASSWORD

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
  exit 1
fi

# Execute the migration file
echo -e "${BLUE}Executing SQL migration file...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/add-fts-to-knowledge.sql

# Apply the new indexes explicitly
echo -e "${BLUE}Creating additional indexes for performance...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS knowledge_chunk_content_idx ON \"KnowledgeChunk\" (content);"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS knowledge_document_user_idx ON \"KnowledgeDocument\" (\"userId\");"


# Check if migration was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migration completed successfully!${NC}"
  
  # Verify the tsvector column was added
  echo -e "${BLUE}Verifying migration...${NC}"
  COLUMN_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='KnowledgeChunk' AND column_name='content_tsv');")
  
  if [[ $COLUMN_EXISTS == *"t"* ]]; then
    echo -e "${GREEN}Verification successful: content_tsv column exists${NC}"
    
    # Count documents that need embedding update
    DOC_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"KnowledgeChunk\" WHERE content_tsv IS NULL;")
    echo -e "${GREEN}Documents that need embedding update: ${DOC_COUNT}${NC}"
    
    echo -e "${BLUE}Full-text search is now enabled for knowledge retrieval!${NC}"
    echo -e "${BLUE}You can now search your CV and other documents more effectively.${NC}"
  else
    echo -e "${RED}Verification failed: content_tsv column does not exist${NC}"
    echo "The migration might have encountered an error."
  fi
else
  echo -e "${RED}Migration failed!${NC}"
  echo "Check the error message above for details."
fi

# Clean up
unset PGPASSWORD
echo -e "${BLUE}Done.${NC}"
