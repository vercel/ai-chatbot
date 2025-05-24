# Project Directory Overview (Focus on API Routes)

This document provides an overview of the directory structure within the `app` folder, with a specific focus on API route locations. This is intended as a reference to ensure clarity on where API endpoints are defined.

## Main `app` Directory Structure relevant to APIs:

```
app/
├── (auth)/                 # Authentication related pages/layouts
│
├── (chat)/                 # Chat interface related pages/layouts
│   ├── api/                # APIs specific to the chat functionality
│   │   ├── chat/           # Handles /api/chat (core chat interactions)
│   │   ├── document/       # Handles /api/document (document/artifact operations)
│   │   ├── files/          # Handles /api/files
│   │   │   └── upload/     # Handles /api/files/upload
│   │   ├── history/        # Handles /api/history (chat history operations)
│   │   ├── messages/       # Directory for /api/messages (NOTE: route.ts was missing)
│   │   ├── n8n-callback/   # Handles /api/n8n-callback (webhook from N8N)
│   │   ├── suggestions/    # Handles /api/suggestions
│   │   └── vote/           # Handles /api/vote
│   │
│   └── chat/
│       └── [id]/           # Dynamic route for individual chat pages
│
├── api/                    # Root API routes (potentially for broader application use)
│   ├── clerk-token-proxy/  # Handles /api/clerk-token-proxy
│   ├── messages-test/      # Handles /api/messages-test (message polling - CONTAINS route.ts)
│   ├── test-post/          # Handles /api/test-post
│   └── webhooks/           # Handles /api/webhooks
│       └── clerk/          # Handles /api/webhooks/clerk
│
├── actions/                # Server Actions
├── components/             # React components (UI)
│   └── ui/
├── lib/                    # Library code (utilities, db connections, etc.)
├── sign-in/                # Sign-in pages
│   └── [[...sign-in]]/
└── sign-up/                # Sign-up pages
    └── [[...sign-up]]/

```

## Key API Endpoint Locations:

*   **Core Chat Logic:** `app/(chat)/api/chat/route.ts`
    *   Handles new message submissions, triggers AI models (including N8N webhooks).
*   **N8N Callback:** `app/(chat)/api/n8n-callback/route.ts`
    *   Receives responses from the N8N workflow.
*   **Message Polling (Intended/Existing):** `app/api/messages-test/route.ts`
    *   This endpoint exists and is designed for fetching messages for a chat, including authentication and ownership checks.
    *   The SWR poll in `components/chat.tsx` should target `/api/messages-test`.
*   **Message Polling (Misconfigured/Missing Route File):** `app/(chat)/api/messages/`
    *   This directory exists but was found to be missing its `route.ts` file.
    *   The SWR poll in `components/chat.tsx` was incorrectly pointed here in a recent change, causing 404s.
*   **Clerk Webhooks:** `app/api/webhooks/clerk/route.ts`
*   **File Uploads:** `app/(chat)/api/files/upload/route.ts`

This overview should help in correctly identifying and referencing API paths. 