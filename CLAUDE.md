# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

### Environment Setup
```bash
# Copy environment file
cp .env.example .env.local

# Install dependencies
pnpm install

# Update to latest AI SDK version (if needed)
pnpm update ai@4.3.15 @ai-sdk/google@1.2.17 @ai-sdk/react@1.2.12
```

### Development
```bash
# Start development server (with Turbo)
pnpm dev

# Build for production (runs migrations first)
pnpm build

# Start production server
pnpm start
```

### Database
```bash
# Run database migrations
pnpm db:migrate

# Generate new migrations
pnpm db:generate

# Open database studio UI
pnpm db:studio

# Push schema changes
pnpm db:push

# Pull schema from database
pnpm db:pull

# Check database status
pnpm db:check

# Update database
pnpm db:up
```

### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Testing
```bash
# Run Playwright e2e tests
pnpm test
```

## Architecture Overview

LostMind AI is a Next.js-based AI chatbot application built on the Vercel AI SDK template, featuring multiple AI models including Gemini 2.5 Pro and Flash. It's currently in a migration process to update to the latest Vercel AI template.

### Key Components

1. **AI Models Integration**
   - Located in `/lib/ai/`
   - Main configuration in `/lib/ai/providers.ts` and `/lib/ai/models.ts`
   - Supports multiple LLM providers (OpenAI and Google)
   - Uses middleware for adding reasoning capability

2. **Chat System**
   - Core chat UI in `/components/chat.tsx`
   - Message handling in `/components/messages.tsx` and `/components/message.tsx`
   - Streaming capabilities with resumable streams
   - File and image attachment support

3. **Authentication**
   - Uses NextAuth v5 in `/app/(auth)/`
   - Login and registration pages
   - User entitlements and rate limiting

4. **Artifacts System**
   - Various types (code, text, sheets, images)
   - Located in `/artifacts/` directory
   - Each artifact type has client and server components

5. **Database**
   - PostgreSQL with Drizzle ORM
   - Schema and migrations in `/lib/db/`
   - Used for storing chat history, user data, and artifacts

### Project Structure

- `/app/` - Next.js app router
- `/components/` - React components
- `/lib/` - Utilities and configurations
- `/hooks/` - React hooks
- `/tests/` - E2E tests with Playwright
- `/public/` - Static assets
- `/Tasks/` - Task management system for the migration

## Testing Strategy

The project uses Playwright for end-to-end testing:

1. **Page Objects**
   - Tests use page objects in `/tests/pages/`
   - Main test file is `/tests/e2e/chat.test.ts`
   - Common fixtures in `/tests/fixtures.ts`

2. **Running Tests**
   - Tests are run with `pnpm test`
   - Some tests verify chat functionality
   - Other tests focus on artifact creation/editing

3. **Test Environment**
   - Uses mock models defined in `/lib/ai/models.test.ts`
   - Environment detection in `/lib/constants.ts`

## Migration Process

LostMind AI is being migrated from a previous implementation to the latest Vercel AI template. The migration is organized into phases:

1. **Phase 1: Foundation**
   - Latest template setup
   - Component migration
   - Basic functionality

2. **Phase 2: Core Features** 
   - Model integration
   - Branding application
   - Feature implementation

3. **Phase 3: Advanced Features**
   - Advanced animations
   - MCP integration
   - Performance optimization

Progress is tracked in `/Tasks/task-tracker.md` and detailed tasks are in phase directories.

## Important Environment Variables

```env
# Required
POSTGRES_URL=your_database_url
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
AUTH_SECRET=your_secret

# Optional
REDIS_URL=redis://...
NEXT_PUBLIC_APP_URL=https://chat.lostmindai.com
NEXT_PUBLIC_BRAND_NAME="LostMind AI"
```

## Brand Information

The project uses custom neural network branding for "LostMind AI" with multiple named models:
- LostMind Lite (GPT-4o-mini)
- LostMind Pro (GPT-4o)
- LostMind Quantum (Gemini 2.5 Pro with reasoning)
- LostMind Vision Pro (Gemini 2.5 Pro with vision)
- LostMind Flash (Gemini 2.5 Flash)

Branding assets are stored in `/public/` and brand guidelines in `/docs/BRAND_GUIDELINES.md`.