# AGENTS.md
This file provides guidance to AI coding agents when working with code in this repository.

Architecture and Modules Overview
- Stack/runtime: Next.js App Router (RSC + Server Actions) with TypeScript; Playwright tests; Tailwind v4; Biome/Ultracite; NextAuth for auth.
- External services: PostgreSQL (`POSTGRES_URL`) via Drizzle; optional Redis (`REDIS_URL`) for resumable streams; Vercel Blob (`BLOB_READ_WRITE_TOKEN`); Vercel AI Gateway (`AI_GATEWAY_API_KEY` for non‑Vercel); OpenTelemetry via `@vercel/otel`.
- Provisioned services (current env): Neon Postgres, Upstash Redis (`REDIS_URL` rediss://), and Vercel Blob token are configured in `.env.local`.
 - Clients available: `@neondatabase/serverless` (Neon Postgres, HTTP/edge) and `@upstash/redis` (Redis REST). Code currently uses `postgres` + `drizzle-orm/postgres-js`; switching to Neon/Upstash requires code changes (see notes below).
- AI pipeline: `lib/ai/providers.ts` defines `myProvider` using Vercel AI Gateway models; prompts in `lib/ai/prompts.ts`; available chat models in `lib/ai/models.ts`.
- Request flow (chat POST): `app/(chat)/api/chat/route.ts`
  - Auth: `auth()` from `app/(auth)/auth.ts` ensures session; middleware `middleware.ts` creates/redirects guest sessions via `app/(auth)/api/auth/guest/route.ts`.
  - Rate limiting: `getMessageCountByUserId` from `lib/db/queries.ts` checks last 24h user message count.
  - Chat init: if missing, `saveChat` persists new chat metadata; prior messages via `getMessagesByChatId`.
  - Streaming: saves user message, creates `streamId` row via `createStreamId`, then `createUIMessageStream` + `streamText` with tools (`getWeather`, `createDocument`, `updateDocument`, `requestSuggestions`). Final AI messages saved with `saveMessages`; usage merged with TokenLens and stored via `updateChatLastContextById`.
  - Response: Server‑Sent Events via `JsonToSseTransformStream`; resumable streams disabled unless `REDIS_URL` present.
- Documents/artifacts flow: tools in `lib/ai/tools/*` call `lib/artifacts/server.ts` handlers per kind (text/code/sheet) which generate/update content and persist via `saveDocument`; `request-suggestions` streams suggestions and saves via `saveSuggestions`.
- Database layer: schema in `lib/db/schema.ts` (tables: `User`, `Chat`, `Message_v2`, `Vote_v2`, `Document`, `Suggestion`, `Stream`); operations in `lib/db/queries.ts`; migrations under `lib/db/migrations/` created with Drizzle (`drizzle.config.ts`).
- Critical entry points: `middleware.ts` (routing/auth guard + `/ping`), `app/(auth)/auth.ts` (NextAuth providers+callbacks), `app/(chat)/api/chat/route.ts` (chat streaming), `app/(chat)/api/document/route.ts` (documents), `lib/db/queries.ts` (DB ops).

- Primary app: Next.js (App Router) TypeScript app in `app/` with API routes under `app/(chat)/api/*`.
- Package manager: `pnpm@9.12.3` (Node.js 20+ recommended; see CI).
- Key services: PostgreSQL via Drizzle ORM; optional Redis for resumable streams; Vercel Blob; AI Gateway.

1) Repo Structure and Navigation
- App: `app/` (pages, API routes, `globals.css`), middleware: `middleware.ts`, OTEL: `instrumentation.ts`.
- UI: `components/`, `components/ui/` (shadcn/ui). Hooks: `hooks/`. Utilities: `lib/`.
- Database: schema `lib/db/schema.ts`, queries `lib/db/queries.ts`, migrations out dir `lib/db/migrations/` (generated), migration runner `lib/db/migrate.ts`, config `drizzle.config.ts`.
- Tests: Playwright in `tests/` with projects `e2e` and `routes` (see `playwright.config.ts`).
- Configs: `package.json` (scripts), `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `biome.jsonc`, `.vscode/*.json`, `.cursor/rules/ultracite.mdc`.
- Path alias: `@/*` mapped to repo root (see `tsconfig.json:paths`).

2) Setup and Dev Environment
- Install deps: `pnpm install`
- Node: CI uses Node 20/LTS (`.github/workflows/*.yml`). Use Node 20+.
- Env file: copy `.env.example` to `.env.local` and fill:
  - `AUTH_SECRET`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `REDIS_URL` (optional), `AI_GATEWAY_API_KEY` (non‑Vercel).
  - Optional (Upstash Redis REST): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (not currently read by code — Unknown—verify integration points).
  - Optional (Neon serverless): can reuse `POSTGRES_URL`; to adopt Neon HTTP driver, switch Drizzle client to `neon-http` (see below).
- Database: PostgreSQL required for app, build, and tests. Create a DB and set `POSTGRES_URL`. Drizzle config: `drizzle.config.ts`.
- Optional: `vercel` CLI to pull env vars (see `README.md:Running locally`).

Provisioned Services (current env)
- Database: Neon Postgres URLs present (pooled and non‑pooled); app uses `POSTGRES_URL`.
- Cache/streams: Upstash Redis `REDIS_URL` present; enables resumable streams when available.
- Storage: Vercel Blob `BLOB_READ_WRITE_TOKEN` present; enables blob operations.

Environment Variables (detected in `.env.local`)
- Auth/session
  - `AUTH_SECRET` — required by NextAuth/middleware (`middleware.ts:22`).
- Database (Neon)
  - `POSTGRES_URL` — used by Drizzle client and migrations (`drizzle.config.ts`, `lib/db/migrate.ts`, `lib/db/queries.ts`).
  - Also present: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`, `POSTGRES_PRISMA_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `PG*` vars. Code only reads `POSTGRES_URL`.
- Redis (Upstash)
  - `REDIS_URL` — enables resumable streams; without it, streams fall back to non‑resumable mode (see `app/(chat)/api/chat/route.ts`).
- Storage/AI
  - `BLOB_READ_WRITE_TOKEN` — used by Vercel Blob features.
  - `AI_GATEWAY_API_KEY` — required for non‑Vercel deployments per `README.md`.
- Frontend public keys
  - `NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` — present but not referenced in code (Unknown—verify usage).

Notes
- Keep `.env.local` free of duplicated template lines. The file currently includes template content from `.env.example`; ensure only valid `KEY=VALUE` assignments remain.

3) Build, Lint, Format, Type‑Check
- Dev server: `pnpm dev` (Next dev, port `3000` default; turbo enabled).
- Build: `pnpm build` runs `tsx lib/db/migrate` then `next build` (requires `POSTGRES_URL` and reachable DB).
- Start (prod): `pnpm start` (serves `.next` build).
- Lint: script uses networked `npx ultracite@latest check`. Prefer offline/local: `pnpm exec ultracite check`.
- Format: script uses networked `npx ultracite@latest fix`. Prefer: `pnpm exec ultracite fix`.
- Type‑check: `pnpm exec tsc --noEmit` (TypeScript is in `devDependencies`).

4) Tests (Playwright)
- All tests: `pnpm test` (exports `PLAYWRIGHT=True` and runs `playwright test`).
- Single file: `pnpm exec playwright test tests/e2e/chat.test.ts`.
- Single test: `pnpm exec playwright test -g "pattern"`.
- By project: `pnpm exec playwright test --project=e2e` or `--project=routes`.
- Debug: `PWDEBUG=1 pnpm exec playwright test` or `pnpm exec playwright test --debug`.
- Install browsers (CI parity): `pnpm exec playwright install --with-deps chromium`.
- Coverage/snapshots: Not found. Use Playwright reporters/options if needed.
- Prereqs: tests start a dev server (`pnpm dev`) and hit `http://localhost:${PORT}/ping` (see `playwright.config.ts`). Ensure `.env.local` and DB are configured.

5) Run and Debug
- Run locally: `pnpm dev` then open `http://localhost:3000`. Override port via `PORT` env (Playwright honors it).
- API auth: middleware redirects unauthenticated users to guest auth; set `AUTH_SECRET` (see `middleware.ts:22`).
- Resumable streams: Enabled when `REDIS_URL` is set (Upstash rediss URL supported). If unset, app streams without resume (`app/(chat)/api/chat/route.ts`).
- Hot reload: standard Next.js dev. For prod, build first then `pnpm start`.

6) CI Parity
- Workflows: `.github/workflows/lint.yml` and `.github/workflows/playwright.yml`.
  - Lint job runs `pnpm install` then `pnpm lint`.
  - Tests job sets required env secrets and runs `pnpm install`, installs Playwright browsers, then `pnpm test`.
- Mirror locally: `pnpm install && pnpm exec ultracite check && pnpm exec playwright install chromium && pnpm test` with `.env.local` populated.
- Branch/PR rules, commit conventions: Unknown—verify.
 - Version alignment: `@playwright/test` pinned to `^1.51.1` to satisfy Next.js peer.

7) Code Conventions
- Formatting/linting: Biome + Ultracite. Config at `biome.jsonc` (extends `ultracite` with selected rule relaxations like `noConsole: off`).
- Cursor rules: follow `.cursor/rules/ultracite.mdc` (accessibility, correctness, React/TS best practices).
- TypeScript: strict mode enabled (`tsconfig.json`: `strict: true`, `strictNullChecks: true`). Use `import type`/`export type`.
- Errors: prefer `ChatSDKError` from `lib/errors` for API responses.
- Public API patterns: Next.js App Router, server actions, path alias `@/*` for imports.
- Styling: Tailwind CSS v4 via `app/globals.css` and `@tailwindcss/postcss`; use `tailwind-merge` for class merging.

8) Tools and Configs to Respect
- VS Code settings: `.vscode/settings.json` enforces Biome as default formatter for TS/JS/JSON/CSS and format on save.
- Drizzle: `drizzle.config.ts` (schema path, output dir). Generate SQL with `pnpm db:generate`. Apply migrations with `pnpm db:migrate` or as part of `pnpm build`.
- Tailwind/PostCSS: `postcss.config.mjs`, `app/globals.css` (`@plugin tailwindcss-animate`, typography).
- TokenLens/Telemetry: OTEL via `instrumentation.ts`; TokenLens usage summarization in chat route.
- Pre‑commit hooks: Not found.
- Copilot/Cursor specific instructions: `.cursor/rules/ultracite.mdc` present; no GitHub Copilot instructions found.
- Neon/Upstash integration (optional, requires code changes):
  - Neon: replace `postgres`/`drizzle-orm/postgres-js` with `@neondatabase/serverless` + `drizzle-orm/neon-http` for edge/serverless. Example: `import { neon } from '@neondatabase/serverless'; import { drizzle } from 'drizzle-orm/neon-http'; const client = neon(process.env.POSTGRES_URL!); const db = drizzle(client);` Update usages in `lib/db/queries.ts` and `lib/db/migrate.ts` (migration runner may still require node Postgres client — Unknown—verify Drizzle migrator compatibility with Neon HTTP).
  - Upstash: if enabling resumable streams via Upstash REST, add a Redis client using `@upstash/redis` and pass it to the streaming context if supported. Current code checks `REDIS_URL` only; wiring for Upstash REST is not present (Unknown—verify `resumable-stream` docs).
 - OpenTelemetry deps: `@opentelemetry/resources@^1.19.0` pinned to match `@vercel/otel@1.x` peers; `@opentelemetry/instrumentation` and `@opentelemetry/sdk-logs` installed.

9) Agent‑Safe Operations (no network/secrets)
- Safe reads/searches: `rg`, `sed`, `node -e` (read‑only). Prefer ripgrep for discovery.
- Lint/format without network: `pnpm exec ultracite check|fix` (works offline only if deps installed). Avoid `npx ...@latest`.
- Type‑check: `pnpm exec tsc --noEmit` (requires installed deps; no network at runtime).
- Avoid running: `pnpm build`, `pnpm dev`, `pnpm test` unless `POSTGRES_URL` and required envs are set and network access is allowed.

10) Common Pitfalls
- Build runs DB migrations; without a reachable `POSTGRES_URL`, `pnpm build` fails. Run `next build` directly only if you intentionally skip migrations (be aware this diverges from CI).
- Tests rely on a running dev server and DB; missing envs cause middleware/auth/DB errors.
- `pnpm lint`/`pnpm format` scripts use `npx ...@latest` and may attempt network access; use `pnpm exec ultracite` to avoid network.
- Do not hand‑edit generated migration files under `lib/db/migrations/`. Use Drizzle commands (`pnpm db:generate`, `pnpm db:up/push/pull`).
- Keep `next-env.d.ts` and lockfiles unchanged manually.

Reference Files
- package.json:1 (scripts, deps, packageManager)
- drizzle.config.ts:1 (schema, out, dialect, credentials)
- lib/db/migrate.ts:1 (migration runner)
- playwright.config.ts:1 (projects, server command, baseURL, timeouts)
- biome.jsonc:1 (lint/format rules)
- tsconfig.json:1 (compiler options, paths)
- README.md:Running locally (env and startup)
