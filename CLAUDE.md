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
- `pnpm db:check` - Check database schema
- `pnpm db:up` - Apply pending migrations

## Project Architecture

This is a Next.js AI chatbot application built with:

### Core Stack
- **Next.js 15** with App Router and React Server Components
- **AI SDK** for LLM integration via OpenRouter
- **OpenRouter Models** - Gemini Flash 1.5 (default), Llama 3.1 8B, Mistral Large
- **NextAuth.js** for authentication with guest mode support
- **Drizzle ORM** with PostgreSQL (Neon Serverless)
- **Vercel Blob** for file storage
- **shadcn/ui** components with Tailwind CSS

### Directory Structure
- `app/(auth)/` - Authentication pages and API routes (login, register)
- `app/(chat)/` - Main chat interface and API routes
- `artifacts/` - Artifact rendering components (code, text, image, sheet)
- `components/` - Reusable UI components
- `lib/ai/` - AI model configuration, prompts, and tools
- `lib/db/` - Database schema, queries, and migrations
- `public/` - Static assets (images, fonts)
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
- Models configured in `lib/ai/models.ts` and selected via `lib/ai/get-model.ts`
- OpenRouter API integration with model prefix handling (`openrouter/` prefix)
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
- OpenRouter: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (default: `google/gemini-flash-1.5`)
- Database: `POSTGRES_URL`
- Authentication: `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- AI Gateway: `AI_GATEWAY_API_KEY` (for non-Vercel deployments)
- Blob storage: `BLOB_READ_WRITE_TOKEN`

### Quick Start

1. **Installation:**
   ```bash
   pnpm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env.local
   # Fill in required environment variables
   ```

3. **Local Development with Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel link
   vercel env pull
   ```

4. **Run Development Server:**
   ```bash
   pnpm dev
   ```
   The application will be available at http://localhost:3000

5. **Production Build:**
   ```bash
   pnpm build
   pnpm start
   ```

## Documentation Resources

When working with this codebase, you can use context7 to fetch up-to-date documentation for the main technologies:

- **Next.js 15**: Library ID `/vercel/next.js` - App Router, Server Components, routing patterns
- **Drizzle ORM**: Library ID `/drizzle-team/drizzle-orm` - Database schema, queries, migrations
- **Neon Postgres**: Library ID `/neondatabase/neon` - Serverless PostgreSQL platform with branching
- **Upstash Redis**: Library ID `/upstash/docs` - Serverless Redis for caching and rate limiting
- **NextAuth.js**: Library ID `/nextauthjs/next-auth` - Authentication patterns and configuration
- **Clerk**: Library ID `/clerk/clerk-docs` - Alternative authentication solution with user management
- **OpenRouter**: Library ID `/openrouter.ai/llmstxt` - Unified API for accessing multiple AI models
- **Xero API**: Library ID `/websites/developer_xero` - Accounting integration and financial data management
- **Vercel AI SDK**: Check latest docs for streaming, tools, and model integration patterns

Use these resources when implementing new features or debugging framework-specific issues.