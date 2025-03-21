# WIZZO - Enhanced AI Chatbot with Knowledge Base

This is an enhanced version of the Next.js AI Chatbot, with extended capabilities for knowledge base integration.

## Features

- Chat with multiple AI models
- Upload and process various document types
- Reference your knowledge base in conversations
- Dark and light theme support
- Secure authentication
- Task Management system (Todoist-inspired)
- Chrome Extension integration

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

4. Set up task management tables:
   ```bash
   npm run db:migrate
   ```
   or
   ```bash
   sh run-task-migration.sh
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

The app uses several environment variables defined in `.env.local`. Make sure to set them properly for your environment.

## Known Issues

### UI Rendering Issues

There are currently UI rendering issues with the Task Management and Extension tabs. If you navigate to these pages and see blank screens, please refer to the debugging guides:

- See `UI_ISSUES_REPORT.md` for a summary of issues
- See `DEBUGGING_GUIDE.md` for detailed debugging steps
- Debug components have been provided in the codebase to help isolate the issues

To quickly debug UI rendering:
1. Rename debug pages to replace the original pages temporarily
2. Refresh the browser to see if basic rendering works
3. Check console errors for more details

## Knowledge Base Integration

This enhanced version includes:
- Local storage for uploaded files
- Improved document processing
- Advanced content extraction
- Fallback search when database issues occur

## Task Management

The Task Management feature allows you to:
- Create, edit, and delete tasks
- Organize tasks into projects
- Set priorities and due dates
- Filter and sort tasks

See `TASKS_README.md` for more information.

## Chrome Extension

The Chrome Extension feature allows you to capture content when offline:
- Record audio notes
- Create text notes
- Process files when back online

See `README-EXTENSION.md` for more information.

## Database Schema

The knowledge base uses three main tables:
- KnowledgeDocument - stores document metadata
- KnowledgeChunk - stores chunks of text with embeddings
- KnowledgeReference - links chunks to chat messages

The task management system uses:
- TaskItem - stores task information
- TaskProject - organizes tasks into projects

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

4. Check the detailed debugging guides:
   - `DEBUGGING_GUIDE.md`
   - `TASK_MANAGEMENT_DEBUG.md`
   - `EXTENSION_DEBUG.md`

## Credits

Based on the original [Next.js AI Chatbot template](https://github.com/vercel/ai-chatbot) by Vercel.
