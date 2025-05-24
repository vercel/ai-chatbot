# Project Directory Overview (Focus on API Routes)

This document provides an overview of the directory structure within the `app` folder, with a specific focus on API route locations. This is intended as a reference to ensure clarity on where API endpoints are defined. **Information is based on `find`, `ls`, and `grep` outputs.**

## Verified API Route Handler Locations (`route.ts` files):

*   `app/api/clerk-token-proxy/route.ts` (serves `/api/clerk-token-proxy`)
*   `app/api/test-post/route.ts` (serves `/api/test-post`)
*   `app/api/webhooks/clerk/route.ts` (serves `/api/webhooks/clerk`)
*   `app/(chat)/api/vote/route.ts` (serves `/api/vote`)
*   `app/(chat)/api/messages/route.ts` (serves `/api/messages`)
*   `app/(chat)/api/chat/route.ts` (serves `/api/chat`)
*   `app/(chat)/api/n8n-callback/route.ts` (serves `/api/n8n-callback`)
*   `app/(chat)/api/document/route.ts` (serves `/api/document`)
*   `app/(chat)/api/history/route.ts` (serves `/api/history`)
*   `app/(chat)/api/files/upload/route.ts` (serves `/api/files/upload`)
*   `app/(chat)/api/suggestions/route.ts` (serves `/api/suggestions`)

## API Directory Structure (Derived from `find` and `ls`):

```
app/
├── (chat)/                 # Chat interface related pages/layouts
│   └── api/                # APIs specific to the chat functionality
│       ├── chat/           # Implements /api/chat (contains route.ts)
│       ├── document/       # Implements /api/document (contains route.ts)
│       ├── files/
│       │   └── upload/     # Implements /api/files/upload (contains route.ts)
│       ├── history/        # Implements /api/history (contains route.ts)
│       ├── messages/       # Implements /api/messages (contains route.ts - MOVED HERE)
│       ├── n8n-callback/   # Implements /api/n8n-callback (contains route.ts)
│       ├── suggestions/    # Implements /api/suggestions (contains route.ts)
│       └── vote/           # Implements /api/vote (contains route.ts)
│
├── api/                    # General APIs not specific to the (chat) UI group
│   ├── clerk-token-proxy/  # Implements /api/clerk-token-proxy (contains route.ts)
│   ├── test-post/          # Implements /api/test-post (contains route.ts)
│   └── webhooks/
│       └── clerk/          # Implements /api/webhooks/clerk (contains route.ts)
│
└── ... (Other top-level app directories and files)
```

## Client-Side Usage of Message Polling API:

*   `components/chat.tsx` uses `/api/messages?chatId=${id}` for SWR polling and cache mutation.
*   No references to `/api/messages-test` were found in `.tsx` files.

This overview should serve as an accurate reference point going forward. 