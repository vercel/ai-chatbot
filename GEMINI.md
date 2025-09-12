# Project Overview

This is a Next.js and App Router-ready AI chatbot. It uses the Vercel AI SDK to connect to AI models, and features a full-featured chat interface.

**Key Technologies:**

*   **Framework:** Next.js
*   **UI:** React, shadcn/ui, Tailwind CSS
*   **AI:** Vercel AI SDK
*   **Authentication:** Auth.js
*   **Database:** Neon Serverless Postgres (via Drizzle ORM)
*   **File Storage:** Vercel Blob
*   **Linting and Formatting:** Biome

**Architecture:**

The application is structured as a standard Next.js App Router project.

*   The main chat interface is located in `app/(chat)`.
*   Authentication is handled in `app/(auth)`.
*   UI components are in the `components` directory.
*   AI-related logic, including model definitions and prompts, is in the `lib/ai` directory.
*   Database schema and queries are in `lib/db`.

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

# Development Conventions

*   **Linting:** The project uses Biome for linting and formatting. Run `pnpm lint` to check for issues.
*   **Styling:** The project uses Tailwind CSS for styling.
*   **Components:** Components are built using shadcn/ui.
*   **Database:** The project uses Drizzle ORM for database access. Migrations are handled by `drizzle-kit`.
