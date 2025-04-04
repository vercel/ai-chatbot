#!/bin/bash

# Run the transcript char count migration
echo "Running transcript character count migration..."
psql $POSTGRES_URL -f ./lib/db/migrations/manual/add_transcript_char_count.sql

echo "Migration completed successfully."