# Project Overview

This is a Next.js and App Router-ready AI chatbot. It uses the Vercel AI SDK to connect to AI models, and features a full-featured chat interface.

**Key Technologies:**

*   **Framework:** Next.js 15.3.0-canary.31 (with App Router and React Server Components)
*   **UI:** React 19.0.0-rc, shadcn/ui, Tailwind CSS
*   **AI:** Vercel AI SDK, OpenRouter (Gemini Flash 1.5, Llama 3.1 8B, Mistral Large)
*   **Authentication:** Auth.js 5.0.0-beta.25 (with guest mode support)
*   **Database:** Neon Serverless Postgres (via Drizzle ORM)
*   **File Storage:** Vercel Blob
*   **Linting and Formatting:** Biome
*   **Package Manager:** pnpm

**Key Features:**

*   Chat with AI models including vision capabilities
*   Document creation and editing (text, code, images, spreadsheets)
*   Real-time collaboration suggestions
*   File upload and processing
*   Guest authentication mode
*   Chat history persistence

**Architecture:**

The application is structured as a standard Next.js App Router project.

*   `app/(chat)`: Contains the main chat interface and related components.
*   `app/(auth)`: Handles user authentication, including login and registration.
*   `artifacts/`: Contains artifact rendering components (code, text, image, sheet).
*   `components`: Contains reusable UI components used throughout the application.
*   `drizzle.config.ts`: Configuration file for Drizzle ORM.
*   `lib/ai`:  Handles all AI-related logic, including model definitions, prompts, and tools.
*   `lib/db`:  Contains the database schema, queries, and migration scripts.
*   `public`: Contains static assets like images and fonts.
*   `tests`: Contains end-to-end tests written with Playwright.

# Building and Running

**1. Installation:**

```bash
pnpm install
```

**2. Environment Variables:**

Copy the `.env.example` file to `.env.local` and fill in the required environment variables.

```bash
cp .env.example .env.local
```

Required environment variables:
- OpenRouter: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (default: `google/gemini-flash-1.5`)
- Database: `POSTGRES_URL`
- Authentication: `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- AI Gateway: `AI_GATEWAY_API_KEY` (for non-Vercel deployments)
- Blob storage: `BLOB_READ_WRITE_TOKEN`

Local development setup:
1. Install Vercel CLI and link project
2. Pull environment variables with `vercel env pull`
3. Run `pnpm install` and `pnpm dev`

**3. Running in Development Mode:**

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**4. Building for Production:**

```bash
pnpm build
```

**5. Running in Production Mode:**

```bash
pnpm start
```

**6. Running Tests:**

```bash
pnpm test
```

# Development Commands

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

# AI Tools

The application includes the following AI tools:

*   **`create-document.ts`**: Creates a new document with a specified title and kind.
*   **`get-weather.ts`**: Fetches the current weather for a given latitude and longitude.
*   **`request-suggestions.ts`**: Generates suggestions for improving the content of a document.
*   **`update-document.ts`**: Updates a document based on a description of the desired changes.

# Documentation Resources

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
