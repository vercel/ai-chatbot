# App Directory

This directory contains the Next.js App Router structure. All routes are defined here using the file-system based routing convention.

## Structure

### `(auth)/`
Authentication-related routes and logic:
- **`auth.ts`** - Auth.js configuration and session management
- **`auth.config.ts`** - Auth configuration settings
- **`actions.ts`** - Server actions for authentication
- **`api/`** - Authentication API routes (NextAuth, guest sessions)
- **`login/`** - Login page
- **`register/`** - Registration page

### `(chat)/`
Main chat application routes:
- **`layout.tsx`** - Layout wrapper with sidebar and data stream provider
- **`page.tsx`** - Home/chat creation page
- **`actions.ts`** - Server actions for chat operations
- **`chat/[id]/`** - Individual chat page with dynamic ID
- **`api/`** - API routes for chat functionality:
  - `chat/` - Chat CRUD operations
  - `chat/[id]/stream/` - Streaming chat responses
  - `document/` - Document management
  - `files/upload/` - File upload handling
  - `history/` - Chat history management
  - `suggestions/` - AI suggestions
  - `vote/` - Message voting

### `dashboard/`
Dashboard page (example/demo page)

### Root Files
- **`layout.tsx`** - Root layout with providers (theme, data stream)
- **`globals.css`** - Global styles

## Route Groups

Parentheses `()` create route groups that don't affect the URL structure:
- `(auth)` - Groups auth routes without adding `/auth` to the URL
- `(chat)` - Groups chat routes, provides shared layout

## Notes

- All API routes use Next.js Route Handlers
- Server components are used by default (marked with `"use client"` when needed)
- Suspense boundaries are used for async data fetching
