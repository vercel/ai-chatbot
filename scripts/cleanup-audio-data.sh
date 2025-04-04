#!/bin/bash

# Script to remove all audio records from database and storage

echo "=== Wizzo Audio Records Cleanup ==="

# Step 1: Run the file cleanup script
echo "--- Removing audio files from storage ---"
node ./scripts/clean-audio-storage.js

# Step 2: Run the database cleanup script
if [ -z "$POSTGRES_URL" ]; then
  echo "POSTGRES_URL environment variable not set."
  echo "Please set it with your database connection string."
  echo "Example: export POSTGRES_URL='postgresql://username:password@localhost:5432/database'"
  exit 1
fi

echo "--- Removing audio records from database ---"
psql $POSTGRES_URL -f ./scripts/remove-audio-records.sql

echo "=== Cleanup completed ==="
echo "You should now be able to run the application."
echo "Don't forget to run the migration to add the transcriptCharCount column:"
echo "psql \$POSTGRES_URL -f ./lib/db/migrations/manual/add_transcript_char_count.sql"
