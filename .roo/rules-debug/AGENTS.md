# Project Debug Rules (Non-Obvious Only)

- E2E tests: Set `PLAYWRIGHT=True` env var; runs in ./tests/ with webServer auto-starting `pnpm dev` (reuseExistingServer: !CI); trace retained on failure only.
- No unit tests; all via Playwright E2E (`npx playwright test --project=e2e`); timeout 240s for tests/expects.
- DB debugging: Migrations via `tsx lib/db/migrate.ts` from root (not drizzle-kit directly); requires `POSTGRES_URL` (Neon); use `drizzle-kit studio` for schema inspection.
- AI debugging: Non-Vercel deploys need `AI_GATEWAY_API_KEY`; models in `lib/ai/models.ts` (Grok defaults); tools trigger handlers in `lib/artifacts/server.ts` - log dataStream for artifact creation.
- Streaming: Debug real-time via `DataStreamHandler` in app/(chat)/page.tsx; `onData` logs usage/costs; errors throw `ChatSDKError` (check console for 'offline:chat').
- Middleware: Includes `/api/:path*` but excludes statics (_next/static, etc.); guest auth silent redirect if no token.
- Production builds: Require `NODE_ENV=production` or features (e.g., auth) break without error; check Vercel env pull.
