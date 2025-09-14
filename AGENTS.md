# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands (Non-Standard)

- `pnpm build`: Auto-runs DB migration (`tsx lib/db/migrate.ts`) before `next build`.
- `pnpm test`: Requires `PLAYWRIGHT=True` env var; runs all E2E tests in `./tests/`.
- Single E2E test: `npx playwright test tests/e2e/artifacts.test.ts --project=e2e` (targets e2e project; no unit tests).
- DB migration: `pnpm db:migrate` executes from root but sources `lib/db/migrate.ts`.

## Code Style (From biome.jsonc Overrides)

- 2-space indent, 80-char line width, LF endings.
- Single quotes in JS, double in JSX; semicolons always; trailing commas in all (objects/arrays/functions).
- Sorted Tailwind classes enforced at error level (`useSortedClasses`).
- Custom a11y: `useSemanticElements` off (buggy), no autofocus ban, no keyWithClickEvents req.
- Nursery rules: `noDocumentImportInPage` warn (Next.js specific), `useValidAutocomplete` warn.
- Overrides for Playwright: `noEmptyPattern` off in `playwright/**`.

## Critical Patterns & Gotchas

- Guest auth: Emails match `/guest-\\d+@example\\.com/` regex; middleware redirects unauth to `/api/auth/guest` with redirectUrl.
- Messages: Multimodal via `parts` array (text, image, tool); convert DB to UI with `convertToUIMessages` in [`lib/utils.ts`](lib/utils.ts:100) (preserves metadata).
- AI Tools: `createDocument`/`updateDocument` in `lib/ai/tools/` trigger artifact handlers (`lib/artifacts/server.ts`); kinds: code (CodeMirror), text (ProseMirror), image (custom editor), sheet (react-data-grid). Pyodide loaded for Python code exec (`app/(chat)/layout.tsx`).
- Streaming: Use `DataStreamProvider`/`DataStreamHandler` for real-time AI updates; `onData` captures usage/model costs.
- Utils: `cn()` for Tailwind merging; `fetchWithErrorHandlers`/`fetcher` throw `ChatSDKError` (codes like 'offline:chat'); simple UUID gen in `generateUUID` (no crypto).
- DB: Drizzle PostgreSQL (Neon); schema in `lib/db/schema.ts` (users/chats/messages/votes/documents/suggestions); queries in `lib/db/queries.ts`; supports v1 (legacy)/v2 message formats.
- Prompts: Artifacts guidance in `lib/ai/prompts.ts` (wait for user feedback before updates; no immediate post-create edits).
- Architecture: Experimental PPR enabled (`next.config.ts`, layouts); middleware matcher includes `/api/:path*` but excludes statics; guest mode via NextAuth with custom provider.

From CLAUDE.md (non-obvious): Title gen via AI in `app/(chat)/actions.ts` (80-char limit, no quotes/colons).
