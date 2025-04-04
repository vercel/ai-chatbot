# Audio Transcript Character Count Feature

This feature adds a "transcriptCharCount" field to the KnowledgeDocument table to store and display the character count of transcribed audio files.

## Migration Required

Before this feature works properly, you need to run the database migration to add the transcriptCharCount column:

```bash
# Make the script executable
chmod +x ./scripts/run-transcript-migration.sh

# Run the migration script
./scripts/run-transcript-migration.sh
```

This will add the transcriptCharCount column to the KnowledgeDocument table in the PostgreSQL database.

## Feature Details

Once the migration is complete:

1. Newly processed audio files will automatically have their transcript character count stored.
2. The knowledge table will display this character count instead of file size for audio files.
3. The total character count in the knowledge table will include transcript character counts.
4. Existing audio files will have their transcript character count updated when viewed.

## Fallback Behavior

The code has been designed to gracefully handle the case where the transcriptCharCount column doesn't exist yet:

- If the column doesn't exist, audio files will show their file size in KB.
- Attempts to update or read the transcriptCharCount field will silently fail.
- Once the migration is run, the application will automatically start using the column.

## Why This Matters

This feature provides a more accurate representation of knowledge content by counting the actual characters in transcribed audio, rather than just showing the file size. This is important for understanding how much textual content is in your knowledge base, regardless of the source format.
