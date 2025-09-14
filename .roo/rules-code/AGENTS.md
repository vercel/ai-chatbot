# Project Coding Rules (Non-Obvious Only)

- Always use `convertToUIMessages` from [`lib/utils.ts`](lib/utils.ts:100) to transform DB messages to UI format (preserves multimodal parts and metadata).
- AI tools (`createDocument`/`updateDocument` in `lib/ai/tools/`) must trigger specific handlers in `lib/artifacts/server.ts`; artifact kinds: 'code' (CodeMirror, Python via Pyodide), 'text' (ProseMirror), 'image' (custom), 'sheet' (react-data-grid).
- No immediate updates to documents after creation; wait for user feedback per `lib/ai/prompts.ts` guidance (prevents unwanted edits).
- Fetch requests: Use `fetchWithErrorHandlers`/`fetcher` from `lib/utils.ts` to throw `ChatSDKError` with codes (e.g., 'offline:chat'); handles JSON error parsing.
- UUID generation: Use simple `generateUUID` in `lib/utils.ts` (string replacement, no crypto API).
- Messages: Multimodal via `parts` array; filter text with `getTextFromMessage` from `lib/utils.ts`.
- Title generation in `app/(chat)/actions.ts`: AI-generated, 80-char limit, no quotes/colons.
- Streaming: `onData` in useChat captures usage/model costs; use `DataStreamProvider` for real-time updates.
- DB queries: Always via `lib/db/queries.ts`; supports v1 (legacy)/v2 message formats.
- Guest emails: Validate with `/guest-\\d+@example\\.com/` regex before auth ops.
