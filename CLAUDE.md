# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI chatbot application built with Next.js 15, AI SDK, and xAI Grok as the default model. It's a sophisticated chat platform with artifact creation, file uploads, and real-time collaboration features.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server with Turbo
pnpm build                  # Run database migrations and build for production
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run Next.js ESLint and Biome linter
pnpm lint:fix               # Auto-fix linting issues
pnpm format                 # Format code with Biome

# Database Operations
pnpm db:generate            # Generate Drizzle schema
pnpm db:migrate            # Run database migrations
pnpm db:studio             # Open Drizzle Studio
pnpm db:push               # Push schema changes to database
pnpm db:pull               # Pull schema from database

# Testing
pnpm test                  # Run Playwright E2E tests
```

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router and experimental PPR (Partial Pre-rendering)
- **AI SDK** for unified AI provider integration
- **xAI Grok** as default model (configurable to OpenAI, Anthropic, etc.)
- **Drizzle ORM** with PostgreSQL
- **NextAuth.js v5** for authentication
- **shadcn/ui** + **Tailwind CSS** for UI

### Key Directory Structure

```
/app/                    # Next.js App Router
├── (auth)/             # Authentication routes
├── (chat)/             # Main chat interface
└── api/                # API routes

/lib/                   # Core business logic
├── ai/                 # AI provider configurations and tools
├── db/                 # Database schema and queries
├── artifacts/          # Artifact handling logic
└── utils/              # Utility functions

/components/            # React components
├── ui/                 # shadcn/ui base components
├── chat/               # Chat-specific components
└── artifacts/          # Artifact display components

/artifacts/             # Artifact implementations
├── code/               # Code editor artifacts
├── image/              # Image generation artifacts
├── sheet/              # Spreadsheet artifacts
└── text/               # Text editor artifacts
```

### Database Schema
- Users with guest and regular account support
- Chat conversations with message versioning (v2 schema)
- Documents/artifacts with collaborative editing
- Voting system for AI responses

### AI Integration Patterns
- Tool-based AI interactions with structured outputs
- Streaming responses with real-time UI updates
- Multi-modal input support (text, images, files)
- Provider-agnostic model configuration in `lib/ai/providers.ts`

### Authentication Flow
- Dual mode: credential-based and guest access
- NextAuth.js with custom providers
- Session management with JWT tokens
- User type differentiation throughout the app

## Development Guidelines

### Database Changes
Always run migrations before building: `pnpm db:migrate` or use the build command which includes migrations.

### AI Provider Configuration
Model providers are configured in `lib/ai/providers.ts`. The app supports switching between multiple providers at runtime.

### Artifact System
The artifact system supports multiple types (text, code, image, sheet) with real-time collaborative editing. Each artifact type has its own implementation in `/artifacts/`.

### Environment Setup
Copy `.env.example` to `.env.local` and configure required environment variables. For production deployment, use Vercel's environment variable management.

### Code Style
The project uses Biome for formatting and linting. Run `pnpm lint:fix` before committing changes.