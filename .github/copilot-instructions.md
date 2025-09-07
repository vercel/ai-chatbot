# AI Agent Instructions for YSH AI Chatbot

## Project Overview

This is a Next.js 15 AI chatbot application for solar energy pre-sales, built with React 19, TypeScript, and the Vercel AI SDK. The application supports multi-agent conversational flows for both homeowners ("owners") and solar integrators ("integrators").

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui + Tailwind CSS + Radix UI primitives
- **AI**: Vercel AI SDK with multiple providers (xAI/Grok, OpenAI, Anthropic)
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Context + SWR for server state
- **Package Manager**: pnpm

### Key Architectural Components

#### 1. Persona System (`lib/persona/`)
- **Owner Mode**: Consumer-focused journey with guided wizard overlay
- **Integrator Mode**: Business-focused with batch processing and advanced features
- Context stored in localStorage, affects UI and feature availability
- Use `usePersona()` hook for persona-aware components

#### 2. Journey Flow System (`apps/web/lib/journey/`)
Phases: Investigation → Detection → Analysis → Dimensioning → Recommendation → LeadMgmt
- Each phase has specific cards and viewers
- Navigation between phases with validation
- Located in `app/journey/[phase]/`

#### 3. Multi-Agent Components (`components/multi-agent/`)
- Phase-based message rendering with icons and styling
- Streaming content display for each conversational phase
- Reusable across different agent flows

#### 4. Artifact System (`lib/artifacts/`)
- Supports text, code, and sheet documents
- Document handlers for creation/update operations
- Persistent storage with user association
- Real-time collaborative editing capabilities

#### 5. Chat Architecture (`components/chat.tsx`)
- Uses `@ai-sdk/react` with custom transport layer
- Real-time streaming with resumable contexts
- Multimodal input support (text, images, files)
- Message parts architecture for complex content

## Critical Developer Workflows

### Development Setup
```bash
pnpm install
pnpm dev  # Runs with Turbo mode
```

### Database Operations
```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema changes (development)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

### Code Quality
```bash
# Lint and format (includes Biome)
pnpm lint

# Format only
pnpm format

# TypeScript checking included in build
pnpm build
```

### Testing
```bash
# E2E tests with Playwright
pnpm test

# Generate test data
pnpm generate:leads
pnpm generate:intent-classification
```

## Project-Specific Patterns

### 1. Message Architecture
- Use `ChatMessage` type with `parts` array for complex content
- Support for text, images, and tool calls
- Attachments separate from message parts
- Vote system for message feedback

### 2. AI Integration Patterns
```typescript
// Model configuration in lib/ai/models.ts
// Provider setup in lib/ai/providers.ts
// Tools in lib/ai/tools/
// Prompts in lib/ai/prompts.ts
```

### 3. Database Patterns
- Use Drizzle ORM with strict typing
- Schema in `lib/db/schema.ts`
- Queries in `lib/db/queries.ts`
- Migrations in `lib/db/migrations/`

### 4. Component Patterns
- Feature-gated components using `feature-gate.tsx`
- Accessibility-first with ARIA support
- Theme-aware with `next-themes`
- Responsive design with Tailwind

### 5. Error Handling
- Custom `ChatSDKError` class
- Consistent error responses from API routes
- Toast notifications for user feedback

## Business Logic Components

### Finance Module (`lib/finance/`)
- Financing simulation with amortization calculations
- Payback period analysis
- Solar ROI calculations

### Journey Cards
- **IntentCard**: Classifies user intentions
- **LeadValidationCard**: Validates prospect data
- **PanelDetectionCard**: AI-powered roof analysis
- **TechnicalFeasibilityCard**: System viability assessment
- **FinancialAnalysisCard**: Cost-benefit analysis

## File Organization Conventions

### Key Directories
- `app/(chat)/`: Main chat interface routes
- `app/(auth)/`: Authentication flows
- `app/api/`: API routes (minimal, most logic in actions)
- `components/`: Reusable UI components
- `lib/`: Business logic and utilities
- `artifacts/`: Document processing handlers
- `hooks/`: Custom React hooks

### Naming Conventions
- Components: PascalCase with `.tsx` extension
- Utilities: camelCase with `.ts` extension
- API routes: `route.ts` in folder-based routing
- Database: Snake_case for SQL, camelCase for TypeScript

## Common Patterns & Gotchas

### 1. Streaming Architecture
- Use `createUIMessageStream` for AI responses
- Handle resumable streams with Redis (optional)
- Data stream context for real-time updates

### 2. Authentication
- NextAuth.js integration with custom providers
- Guest user support for demos
- Session-based entitlements system

### 3. File Uploads
- Vercel Blob storage for file persistence
- Multimodal input component for various file types
- Attachment preprocessing and validation

### 4. State Management
- SWR for server state and caching
- React Context for global app state (theme, persona)
- Local storage for user preferences

### 5. Build Optimizations
- Next.js Turbo mode for development
- Tree shaking with dynamic imports
- Image optimization with Next.js Image component

## Deployment & Environment

### Environment Variables
- `POSTGRES_URL`: Database connection
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway authentication
- `AUTH_SECRET`: NextAuth secret
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage

### CI/CD
- GitHub Actions for linting and testing
- Playwright for E2E testing
- Automatic deployment to Vercel

## Development Best Practices

1. **Always run migrations** after schema changes: `pnpm db:migrate`
2. **Use TypeScript strictly** - no `any` types without justification
3. **Test E2E flows** with Playwright for critical user journeys
4. **Follow accessibility guidelines** - all components must be keyboard navigable
5. **Use the persona system** for feature gating and conditional UI
6. **Handle streaming errors gracefully** with proper fallbacks
7. **Validate data** at API boundaries using Zod schemas
8. **Keep components modular** and reusable across different contexts

## Key Files to Reference

- `lib/db/schema.ts`: Database schema and types
- `lib/ai/models.ts`: AI model configurations
- `components/chat.tsx`: Main chat component architecture
- `lib/persona/context.tsx`: Persona system implementation
- `apps/web/lib/journey/map.ts`: Journey phase definitions
- `lib/artifacts/server.ts`: Document handling patterns</content>
<parameter name="filePath">c:\Users\fjuni\ysh-root\ai-ysh\.github\copilot-instructions.md