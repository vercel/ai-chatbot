# Plan Status: Implement Resumable LLM Streams

## Checklist

*   🔴 **Dependency:** Add required clients and utilities
    *   Add `@upstash/redis`, `@upstash/workflow`, `@tanstack/react-query`, `nanoid`, `zod`.
    *   Update `package.json`.
    *   Run `pnpm install`.
*   🔴 **Configuration:** Set up Redis connection
    *   Create Upstash Redis instance (or use existing).
    *   Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`, `.env.example`, and Vercel (Update var names if different).
*   🔴 **Provider:** Set up React Query (`src/components/providers.tsx` or similar)
    *   Create `QueryClientProvider` setup if not already present.
*   🔴 **Utility:** Create Redis client utility (`lib/redis.ts` or `utils/redis.ts`)
    *   Initialize and export Redis client instance using env vars.
*   🔴 **Types:** Define message schemas (`lib/message-schema.ts`)
    *   Define types/schemas for `CHUNK`, `METADATA`, `ERROR` messages using Zod (as seen in example). Include `StreamStatus` enum.
*   🔴 **Hook:** Create session management hook (`hooks/use-llm-session.ts` or similar)
    *   Implement logic to generate (`nanoid`), store (`localStorage`), retrieve, and sync `sessionId` with URL query params.
*   🔴 **API Route:** Create Stream Generator (`app/(chat)/api/llm-stream/route.ts`)
    *   Use `@upstash/workflow/nextjs` (`serve`).
    *   Accept `prompt`, `sessionId`.
    *   Implement steps (`mark-stream-start`, `generate-llm-response`, `mark-stream-end`).
    *   Use Vercel AI SDK (`streamText`).
    *   Write `METADATA` (STARTED) message to Redis Stream (`xadd`).
    *   Write `CHUNK` messages to Redis Stream (`xadd`).
    *   Publish notifications to Redis Pub/Sub (`publish`) after each `xadd`.
    *   Write `METADATA` (COMPLETED) message to Redis Stream (`xadd`).
*   🔴 **API Route:** Create Stream Consumer (`app/(chat)/api/check-stream/route.ts`)
    *   Accept `sessionId` from query params.
    *   Check if stream key exists (`redis.exists`), return 412 status if not.
    *   Use Server-Sent Events (SSE).
    *   Generate unique consumer `groupName` (`nanoid`).
    *   Create Redis Stream Consumer Group (`redis.xgroup`).
    *   Read messages using `redis.xreadgroup` ('>' ID).
    *   Subscribe to Redis Pub/Sub (`redis.subscribe`) for real-time updates.
    *   Push validated messages to client using SSE format (`data: JSON.stringify(...)\n\n`).
    *   Handle client disconnects (`req.signal.addEventListener("abort")`) to cleanup subscription.
*   🔴 **Client:** Modify chat page/component (`app/(chat)/chat/[id]/page.tsx` or hook)
    *   Integrate `useLLMSession` hook.
    *   Use `@tanstack/react-query`'s `useMutation` to trigger the `/api/llm-stream` route (POST request) with prompt and new/regenerated `sessionId`.
    *   Use `@tanstack/react-query`'s `useQuery` to connect to `/api/check-stream` (SSE GET request) with current `sessionId`.
    *   Implement `queryFn` for `useQuery` to handle SSE connection (`fetch`, `ReadableStream`, `TextDecoderStream`).
    *   Handle 412 status from `/api/check-stream` in `useQuery`'s `retry` logic.
    *   Parse/validate incoming SSE messages (`validateMessage`).
    *   Update UI state (response text, status) based on `CHUNK` and `METADATA` messages.
    *   Use `AbortController` to manage SSE connection lifecycle.
*   🔴 **Testing:** Thoroughly test stream resilience
    *   Test network interruptions.
    *   Test page refreshes.
    *   Test closing/reopening tab/browser.
    *   Test long generations.
    *   Test concurrent stream viewing (optional).

*(**Legend:** 🔴 = Not Started, 🟡 = In Progress, 🟢 = Done)*

---

## 1. Goal

Implement a resilient LLM streaming mechanism based on the architecture described in the Upstash blog post ([How to Build LLM Streams That Survive Reconnects, Refreshes, and Crashes](https://upstash.com/blog/resumable-llm-streams)) and demonstrated in the `joschan21-resumable-llm-streams` example. This involves decoupling the stream generation process from the client connection using Redis Streams/Pub/Sub, `@upstash/workflow`, and `@tanstack/react-query`, making the chat experience robust against interruptions.

## 2. Problem / Opportunity

The current implementation uses a direct streaming connection between the client and the chat API route (`/api/chat`). This approach is susceptible to interruptions (network glitches, refreshes, long generations). Implementing resumable streams provides an opportunity to significantly improve the user experience by ensuring that generations continue in the background and can be seamlessly rejoined by the client.

## 3. Solution Strategy

1.  **Introduce Dependencies:** Add Upstash Redis, Upstash Workflow, React Query, Zod, and NanoID as dependencies. Configure Redis connection details. Set up React Query provider.
2.  **Session Management:** Implement a `useLLMSession` hook to manage a unique `sessionId` per browser session, persisting it in `localStorage` and syncing with URL parameters.
3.  **Decouple Generation:** Create a "generator" API endpoint (`/api/llm-stream`) using `@upstash/workflow`. This endpoint receives the chat request (`prompt`, `sessionId`), initiates the LLM stream (Vercel AI SDK), writes each chunk and start/end metadata to a unique Redis Stream, and publishes notifications via Redis Pub/Sub.
4.  **Implement Consumer:** Create a "consumer" API endpoint (`/api/check-stream`) using Server-Sent Events (SSE). The client connects here via a React Query `useQuery` hook, providing the `sessionId`. The endpoint checks for the stream's existence (returning 412 if not ready), uses Redis Streams Consumer Groups to read messages, subscribes to Pub/Sub for real-time updates, and pushes messages to the client via SSE.
5.  **Modify Client:** Update the chat UI component to use the `useLLMSession` hook. Use React Query's `useMutation` to trigger the generator endpoint and `useQuery` to establish and manage the SSE connection to the consumer endpoint, handling message parsing, state updates, retries (on 412), and connection management.
6.  **Define Message Structure:** Use `lib/message-schema.ts` (with Zod) to define and validate the structure of messages (`CHUNK`, `METADATA`, `ERROR`) passed through Redis.

## 4. File Changes Overview

*   **New Files:**
    *   `docs/plan-resumable-streams.md` (This file)
    *   `lib/redis.ts` or `utils/redis.ts` (Redis client utility)
    *   `lib/message-schema.ts` (Message type definitions)
    *   `hooks/use-llm-session.ts` (Session ID management hook)
    *   `app/(chat)/api/llm-stream/route.ts` (Stream Generator API)
    *   `app/(chat)/api/check-stream/route.ts` (Stream Consumer SSE API)
    *   *(Potentially `components/providers.tsx` if React Query provider doesn't exist)*
*   **Modified Files:**
    *   `package.json` (Add dependencies)
    *   `.env.local`, `.env.example` (Add Redis env vars)
    *   `app/(chat)/chat/[id]/page.tsx` (or related component/hook managing chat state/fetching) (Client-side logic update using hooks and React Query)
    *   *(Potentially Vercel environment variables)*

## 5. Action Plan

*(This section will be filled in as we work through the checklist items)*

--- 