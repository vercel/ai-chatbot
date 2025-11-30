# Frontend API Endpoints Reference

This document lists all API endpoints currently accessed by the frontend, organized by functionality.

## Summary

**Total Endpoints: 7**

1. `/api/chat` - Chat operations (POST, DELETE)
2. `/api/history` - Chat history (GET, DELETE)
3. `/api/vote` - Message voting (GET, PATCH)
4. `/api/document` - Document operations (GET, POST, DELETE)
5. `/api/files/upload` - File uploads (POST)
6. `/api/auth/guest` - Guest authentication (GET redirect)
7. `/api/auth/*` - NextAuth endpoints (handled by NextAuth)

---

## 1. Chat Endpoint (`/api/chat`)

### POST `/api/chat`
**Purpose:** Create or continue a chat conversation with streaming AI responses

**Used in:**
- `components/chat.tsx` - Main chat component via `DefaultChatTransport`

**Request Body:**
```typescript
{
  id: string,                    // Chat ID (UUID)
  message: ChatMessage,          // User message
  selectedChatModel: string,     // AI model to use
  selectedVisibilityType: string // "private" | "public"
}
```

**Response:** Server-Sent Events (SSE) stream with AI responses

**Status:** ✅ **Already using API client** (`getApiUrl("/api/chat")`)

---

### DELETE `/api/chat?id={id}`
**Purpose:** Delete a specific chat

**Used in:**
- `components/sidebar-history.tsx` (line 127) - Delete individual chat

**Method:** DELETE
**Query Params:** `id` (chat UUID)

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

## 2. History Endpoint (`/api/history`)

### GET `/api/history`
**Purpose:** Get paginated chat history

**Used in:**
- `components/sidebar-history.tsx` (lines 88, 97) - Via SWR infinite pagination
- `hooks/use-chat-visibility.ts` (line 21) - Cache access

**Query Params:**
- `limit` (default: 20)
- `ending_before` (optional, for pagination)

**Response:**
```typescript
{
  chats: Chat[],
  hasMore: boolean
}
```

**Status:** ✅ **Using `fetcher`** (which now uses API client)

---

### DELETE `/api/history`
**Purpose:** Delete all chats for the current user

**Used in:**
- `components/app-sidebar.tsx` (line 44) - "Delete All Chats" button

**Method:** DELETE

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

## 3. Vote Endpoint (`/api/vote`)

### GET `/api/vote?chatId={id}`
**Purpose:** Get votes for messages in a chat

**Used in:**
- `components/chat.tsx` (line 157) - Via SWR to fetch votes
- `components/message-actions.tsx` (lines 93, 142) - Mutate votes after voting

**Query Params:** `chatId` (chat UUID)

**Response:** `Vote[]`

**Status:** ✅ **Using `fetcher`** (which now uses API client)

---

### PATCH `/api/vote`
**Purpose:** Vote on a message (upvote or downvote)

**Used in:**
- `components/message-actions.tsx` (lines 80, 129) - Upvote/downvote buttons

**Request Body:**
```typescript
{
  chatId: string,
  messageId: string,
  type: "up" | "down"
}
```

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

## 4. Document Endpoint (`/api/document`)

### GET `/api/document?id={id}`
**Purpose:** Get document(s) by ID

**Used in:**
- `components/document-preview.tsx` (line 40) - Via SWR to fetch document
- `components/artifact.tsx` (line 96) - Via SWR to fetch document
- `components/version-footer.tsx` (line 59) - Document version URL

**Query Params:** `id` (document UUID)

**Response:** `Document[] (array, but typically one document)`

**Status:** ✅ **Using `fetcher`** (which now uses API client)

---

### POST `/api/document?id={id}`
**Purpose:** Create or update a document

**Used in:**
- `components/artifact.tsx` (line 150) - Save document content

**Query Params:** `id` (document UUID)

**Request Body:**
```typescript
{
  title: string,
  content: string,
  kind: "text" | "code" | "sheet" | "image"
}
```

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

### DELETE `/api/document?id={id}&timestamp={timestamp}`
**Purpose:** Delete a specific version of a document

**Used in:**
- `components/version-footer.tsx` (line 61) - Delete document version

**Query Params:**
- `id` (document UUID)
- `timestamp` (ISO date string)

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

## 5. Files Endpoint (`/api/files/upload`)

### POST `/api/files/upload`
**Purpose:** Upload a file (image) to blob storage

**Used in:**
- `components/multimodal-input.tsx` (line 175) - File upload handler

**Request:** `FormData` with `file` field

**Response:**
```typescript
{
  url: string,           // Public URL
  pathname: string,      // File path
  contentType: string    // MIME type
}
```

**Status:** ⚠️ **Direct fetch() call** - Could be updated to use `apiFetch`

---

## 6. Authentication Endpoints

### GET `/api/auth/guest`
**Purpose:** Create guest user session (redirect endpoint)

**Used in:**
- `app/(chat)/page.tsx` (line 22) - Redirect if not authenticated
- `app/(chat)/chat/[id]/page.tsx` (line 31) - Redirect if not authenticated
- `proxy.ts` (line 30) - Redirect unauthenticated users

**Method:** GET (redirects to NextAuth)

**Status:** ⚠️ **NextAuth route** - Handled by Next.js, not migrated to FastAPI yet

---

### NextAuth Routes (`/api/auth/*`)
**Purpose:** NextAuth.js authentication endpoints

**Used in:**
- NextAuth handles: `/api/auth/signin`, `/api/auth/signout`, `/api/auth/callback/*`, etc.
- `app/(auth)/auth.ts` - NextAuth configuration

**Status:** ⚠️ **NextAuth routes** - Not migrated to FastAPI (authentication still uses NextAuth)

---

## Migration Status Summary

### ✅ Already Using API Client (Auto-routed to FastAPI)
- `GET /api/history` - Via `fetcher` utility
- `GET /api/vote?chatId={id}` - Via `fetcher` utility
- `GET /api/document?id={id}` - Via `fetcher` utility
- `POST /api/chat` - Via `getApiUrl()` in chat component

### ⚠️ Direct fetch() Calls (Need Manual Update)
- `DELETE /api/chat?id={id}` - `components/sidebar-history.tsx`
- `DELETE /api/history` - `components/app-sidebar.tsx`
- `PATCH /api/vote` - `components/message-actions.tsx`
- `POST /api/document?id={id}` - `components/artifact.tsx`
- `DELETE /api/document?id={id}&timestamp={ts}` - `components/version-footer.tsx`
- `POST /api/files/upload` - `components/multimodal-input.tsx`

### ⚠️ NextAuth Routes (Not Migrated)
- `/api/auth/guest` - NextAuth redirect
- `/api/auth/*` - All NextAuth endpoints

---

## FastAPI Backend Endpoints Status

Based on `backend/app/main.py`, these endpoints are already stubbed:

✅ `/api/auth/*` - Authentication (login, register, guest)
✅ `/api/chat` - Chat endpoint (POST, DELETE)
✅ `/api/history` - History endpoint (GET, DELETE)
✅ `/api/vote` - Vote endpoint (GET, PATCH)
✅ `/api/document` - Document endpoint (GET, POST, DELETE)
✅ `/api/files/upload` - File upload endpoint (POST)

**Note:** All endpoints exist in FastAPI but need full implementation.

---

## Recommendations

1. **Update direct fetch() calls** to use `apiFetch` from `lib/api-client.ts` for consistency
2. **Start with chat endpoint** - Already using API client, just needs FastAPI implementation
3. **Migrate authentication last** - NextAuth is complex, handle after other endpoints work
4. **Test incrementally** - Use `NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat` to test one at a time

---

## Quick Reference: Update Direct fetch() Calls

To update a direct `fetch()` call to use the API client:

**Before:**
```typescript
fetch('/api/history', { method: 'DELETE' })
```

**After:**
```typescript
import { apiFetch } from '@/lib/api-client';
apiFetch('/api/history', { method: 'DELETE' })
```

This ensures the request is automatically routed to FastAPI when configured.

