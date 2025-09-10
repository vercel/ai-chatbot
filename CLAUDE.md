# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Run database migrations then build for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run Next.js ESLint and Biome linting with auto-fix
- `pnpm lint:fix` - Run linting with fixes for both ESLint and Biome
- `pnpm format` - Format code using Biome

### Database Operations
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run migrations (`npx tsx lib/db/migrate.ts`)
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check migration status
- `pnpm db:up` - Apply migrations

### Testing
- `pnpm test` - Run Playwright E2E tests (sets PLAYWRIGHT=True environment variable)

## Architecture Overview

### Application Structure
This is a Next.js 15 AI chatbot application using App Router with the following key architectural patterns:

**Route Organization:**
- `app/(auth)/` - Authentication pages and API routes (login, register, auth config)
- `app/(chat)/` - Main chat interface and chat-related API routes
- Uses route groups for logical separation while maintaining clean URLs

**Database Layer:**
- PostgreSQL with Drizzle ORM (`lib/db/`)
- Schema includes Users, Chats, Messages (with v2 schema migration)
- Drizzle migrations stored in `lib/db/migrations/`

**AI Integration:**
- Built on Vercel AI SDK v5 with AI Gateway for model routing
- Default models: xAI Grok (grok-2-vision-1212, grok-3-mini) via AI Gateway
- Supports multiple providers (OpenAI, Anthropic, xAI, Fireworks)
- Chat streaming and tool calls implemented

### Key Libraries and Tools
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Auth.js (NextAuth.js v5) with bcrypt-ts
- **Database**: Drizzle ORM + PostgreSQL (Vercel Postgres)
- **Storage**: Vercel Blob for file storage
- **Code Quality**: Biome for formatting/linting, ESLint for additional checks
- **Testing**: Playwright for E2E testing
- **Editor**: ProseMirror for rich text editing
- **UI Components**: Radix UI primitives with custom implementations in `components/`

### Environment Setup
The application requires these environment variables (see `.env.example`):
- `AUTH_SECRET` - Authentication secret key
- `AI_GATEWAY_API_KEY` - Only required for non-Vercel deployments
- `POSTGRES_URL` - Database connection URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `REDIS_URL` - Redis connection for caching

### Code Organization
- `components/` - Reusable UI components (48+ components)
- `lib/` - Utilities, database schema, AI setup, and shared logic
- `hooks/` - Custom React hooks
- `app/` - Next.js App Router pages and API routes
- `artifacts/` - Generated artifacts from AI interactions

### Development Notes
- Uses pnpm as package manager
- TypeScript with strict configuration
- Biome is the primary formatter/linter (configured in `biome.jsonc`)
- Database migrations run automatically during build process
- Supports both light and dark themes via next-themes
- React 19 RC version in use