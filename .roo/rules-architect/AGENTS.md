# Project Architecture Rules (Non-Obvious Only)

- Experimental PPR enabled (`next.config.ts`); layouts use server components; impacts streaming and artifact rendering.
- AI tools must be stateless; hidden caching in `lib/ai/providers.ts` assumes this for Grok models.
- Streaming architecture: `DefaultChatTransport` with custom prepareSendMessagesRequest; `onData` for usage tracking; DataStream via provider for real-time artifact updates.
- DB migrations forward-only (Drizzle push/check); schema v1/v2 compatibility required; Neon PostgreSQL with Vercel Blob for documents.
- Auth: Guest mode stateless (regex email), regular via NextAuth custom provider; middleware redirects unauth to /api/auth/guest with redirectUrl.
- Artifacts: Isolation via kinds/handlers; Python exec via Pyodide in webview-like (no localStorage); no external deps in code prompts.
- Monorepo-like: No circular deps, but types in lib/types.ts shared; queries centralized in lib/db/queries.ts.
- Performance: Throttle 100ms in useChat; 240s timeouts for E2E; Vercel OTEL for telemetry.
