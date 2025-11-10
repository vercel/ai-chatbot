# Lib Directory

Shared library code, utilities, and business logic. This directory contains reusable code that's not specific to routes or components.

## Structure

### `ai/`
AI/LLM integration code:
- **`models.ts`** - AI model definitions and configuration
- **`models.mock.ts`** - Mock models for testing
- **`models.test.ts`** - Model tests
- **`providers.ts`** - AI provider wrappers (OpenAI, etc.)
- **`prompts.ts`** - Prompt templates and utilities
- **`entitlements.ts`** - Feature entitlement checks
- **`tools/`** - AI tool definitions:
  - `create-document.ts` - Document creation tool
  - `update-document.ts` - Document update tool
  - `request-suggestions.ts` - Suggestion request tool
  - `get-weather.ts` - Weather fetching tool

### `artifacts/`
Artifact server-side logic:
- **`server.ts`** - Server-side artifact processing

### `db/`
Database layer using Drizzle ORM:
- **`schema.ts`** - Database schema definitions (tables, columns, relations)
- **`queries.ts`** - Database query functions
- **`utils.ts`** - Database utility functions
- **`migrate.ts`** - Migration runner
- **`migrations/`** - SQL migration files (snake_case naming convention)
- **`helpers/`** - Database helper functions:
  - `01-core-to-parts.ts` - Schema transformation helpers

### `editor/`
ProseMirror editor integration:
- **`config.ts`** - Editor configuration
- **`functions.tsx`** - Editor functions and commands
- **`react-renderer.tsx`** - React renderer for ProseMirror
- **`suggestions.tsx`** - Suggestion system integration
- **`diff.js`** - Diff calculation utilities

### Root Files
- **`types.ts`** - Shared TypeScript type definitions
- **`utils.ts`** - General utility functions
- **`constants.ts`** - Application constants
- **`errors.ts`** - Error handling utilities
- **`usage.ts`** - Usage tracking utilities

## Database Conventions

- All table and column names use **snake_case**
- Tables: `users`, `chats`, `messages`, `votes`, `documents`, `suggestions`, `streams`
- Columns: `created_at`, `user_id`, `chat_id`, `message_id`, etc.
- Use Drizzle ORM for type-safe database access
- Migrations are numbered sequentially: `0008_convert_to_snake_case.sql`

## Notes

- All database queries should go through `lib/db/queries.ts`
- AI tools are defined in `lib/ai/tools/`
- Editor logic is isolated in `lib/editor/`
- Shared types are centralized in `lib/types.ts`
