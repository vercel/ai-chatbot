# WIZZO - Enhanced AI Chatbot with Knowledge Base

This is an enhanced version of the Next.js AI Chatbot, with extended capabilities for knowledge base integration.

## Features

- Chat with multiple AI models
- Upload and process various document types
- Reference your knowledge base in conversations
- Dark and light theme support
- Secure authentication

## Setting Up Locally

### Quick Start

Run the automated setup script:

```bash
# Make the script executable
chmod +x scripts/start-wizzo.sh

# Run the script
./scripts/start-wizzo.sh
```

This script will:
1. Set up local storage directories
2. Fix database schema issues
3. Set up knowledge base tables
4. Install dependencies if needed
5. Start the development server

### Manual Setup

If you prefer to set up manually:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up local storage:
   ```bash
   pnpm setup:local
   ```

3. Fix database issues:
   ```bash
   pnpm fix:database
   pnpm fix:knowledge
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

The app uses several environment variables defined in `.env.local`. Make sure to set them properly for your environment.

## Knowledge Base Integration

This enhanced version includes:
- Local storage for uploaded files
- Improved document processing
- Advanced content extraction
- Fallback search when database issues occur

## Database Schema

The knowledge base uses three main tables:
- KnowledgeDocument - stores document metadata
- KnowledgeChunk - stores chunks of text with embeddings
- KnowledgeReference - links chunks to chat messages

## Troubleshooting

If you encounter issues:

1. Run the database diagnostic:
   ```bash
   pnpm diagnose:schema
   ```

2. Fix knowledge tables specifically:
   ```bash
   pnpm fix:knowledge
   ```

3. Clear and recreate local storage:
   ```bash
   rm -rf storage
   pnpm setup:local
   ```

## Credits

Based on the original [Next.js AI Chatbot template](https://github.com/vercel/ai-chatbot) by Vercel.
