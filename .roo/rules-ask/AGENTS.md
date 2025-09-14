# Project Documentation Rules (Non-Obvious Only)

- AI prompts in `lib/ai/prompts.ts` are canonical reference for artifacts (wait for feedback before updates; no post-create edits); code prompts enforce Python stdlib only.
- Artifact kinds: 'code' (Python via Pyodide, no other langs), 'text' (ProseMirror), 'image' (custom), 'sheet' (CSV via PapaParse); handlers in `lib/artifacts/server.ts`.
- DB schema: `lib/db/schema.ts` has users/chats/messages/votes/documents/suggestions; v1 messages legacy (no parts), v2 multimodal; queries in `lib/db/queries.ts`.
- Middleware matcher: `/api/:path*` included but excludes _next/static/_next/image/favicon.ico etc.; guest mode via custom NextAuth provider.
- Utils docs: `convertToUIMessages` preserves metadata; `getTextFromMessage` for text extraction from parts.
- CLAUDE.md non-obvious: Title gen AI in `app/(chat)/actions.ts` (80-char, no quotes/colons); Pyodide in layout for code exec.
- Env: `.env.example` requires `POSTGRES_URL`, `AUTH_SECRET`, `AI_GATEWAY_API_KEY` (non-Vercel), `BLOB_READ_WRITE_TOKEN`; Vercel env pull for local.
- No separate test folder; E2E in ./tests/ with fixtures/helpers.
