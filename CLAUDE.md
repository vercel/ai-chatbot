# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Core development commands using pnpm:

- `pnpm dev` - Start development server with Turbo (http://localhost:3000)
- `pnpm build` - Run database migrations and build for production
- `pnpm start` - Start production server
- `pnpm test` - Run Playwright e2e tests (requires PLAYWRIGHT=True environment variable)

Code quality and formatting:
- `pnpm lint` - Run Biome linter with auto-fixes
- `pnpm lint:fix` - Run linter and formatter with auto-fixes
- `pnpm format` - Format code with Biome

Database operations (Drizzle ORM):
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Apply database migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from database

## Project Architecture

This is a Next.js AI chatbot application built with:

### Core Stack
- **Next.js 15** with App Router and React Server Components
- **AI SDK** for LLM integration with Vercel AI Gateway
- **xAI Grok models** as default (grok-2-vision-1212, grok-3-mini)
- **NextAuth.js** for authentication with guest mode support
- **Drizzle ORM** with PostgreSQL (Neon Serverless)
- **Vercel Blob** for file storage
- **shadcn/ui** components with Tailwind CSS

### Directory Structure
- `app/(auth)/` - Authentication pages and API routes
- `app/(chat)/` - Main chat interface and API routes
- `artifacts/` - Artifact rendering components (code, text, image, sheet)
- `components/` - Reusable UI components
- `lib/ai/` - AI model configuration, prompts, and tools
- `lib/db/` - Database schema, queries, and migrations
- `tests/` - Playwright e2e tests

### Key Features
- Chat with AI models including vision capabilities
- Document creation and editing (text, code, images, spreadsheets)
- Real-time collaboration suggestions
- File upload and processing
- Guest authentication mode
- Chat history persistence

### Authentication Flow
- Guest users are automatically created via `/api/auth/guest`
- Middleware redirects unauthenticated users to guest auth
- Regular users can sign in/register at `/login` and `/register`

### Database Schema
- Users, chats, messages with voting system
- Documents with collaborative suggestions
- Stream handling for real-time updates
- Supports both v1 (deprecated) and v2 message formats

### AI Integration
- Models configured in `lib/ai/models.ts`
- Tools for document creation, weather, and suggestions
- Streaming responses via AI SDK
- Usage tracking and context management

## Code Style and Linting

Uses **Biome** for linting and formatting with these key rules:
- 2-space indentation, 80 character line width
- Single quotes for JavaScript, double quotes for JSX
- Semicolons required, trailing commas enforced
- Custom accessibility rules with some exceptions for UX
- Sorted Tailwind classes enforced
- TypeScript strict mode enabled

## Environment Setup

Required environment variables (see `.env.example`):
- Database: `POSTGRES_URL`
- Authentication: `AUTH_SECRET`
- AI Gateway: `AI_GATEWAY_API_KEY` (for non-Vercel deployments)
- Blob storage: `BLOB_READ_WRITE_TOKEN`

Local development setup:
1. Install Vercel CLI and link project
2. Pull environment variables with `vercel env pull`
3. Run `pnpm install` and `pnpm dev`