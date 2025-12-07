# Patching Approach: Incremental FastAPI Migration

This document describes the simpler approach of patching the existing `lib` to route API calls to FastAPI backend, rather than doing a full migration.

## Overview

Instead of migrating everything at once, we:
1. Created an API client wrapper (`lib/api-client.ts`) that routes requests based on environment variables
2. Updated existing utilities (`fetcher`, `fetchWithErrorHandlers`) to use the new client
3. Can migrate endpoints one at a time by updating environment variables

## Benefits

✅ **Incremental**: Migrate endpoints one at a time
✅ **Low Risk**: Keep Next.js routes as fallback
✅ **Easy Rollback**: Just change environment variables
✅ **Minimal Changes**: Most code continues to work as-is

## Setup

### 1. Environment Variables

Add to `.env.local`:

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Option A: Route ALL endpoints to FastAPI
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true

# Option B: Route SPECIFIC endpoints to FastAPI (recommended for incremental migration)
NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat,history,vote
```

### 2. How It Works

The API client (`lib/api-client.ts`) automatically:
- Routes requests to FastAPI if the endpoint matches configuration
- Adds JWT authentication headers for FastAPI requests
- Falls back to Next.js API routes for non-migrated endpoints

### 3. Current Status

**✅ Already Updated:**
- `lib/utils.ts` - `fetcher` and `fetchWithErrorHandlers` now use API client
- `components/chat.tsx` - Chat endpoint uses API client

**🔄 Still Using Next.js Routes (can be updated incrementally):**
- Direct `fetch()` calls in:
  - `components/sidebar-history.tsx` - History deletion
  - `components/message-actions.tsx` - Voting
  - `components/multimodal-input.tsx` - File uploads
  - `components/document-preview.tsx` - Document fetching
  - `components/artifact.tsx` - Document operations

## Migration Strategy

### Phase 1: Test with One Endpoint

1. Set environment variable:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat
   ```

2. Implement the endpoint in FastAPI backend

3. Test the endpoint works

4. If successful, add more endpoints:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat,history
   ```

### Phase 2: Update Direct Fetch Calls

For components that use direct `fetch()` calls, you can either:

**Option A:** Update to use `apiFetch` from `lib/api-client.ts`:
```typescript
import { apiFetch } from '@/lib/api-client';

// Instead of:
fetch('/api/history', { method: 'DELETE' })

// Use:
apiFetch('/api/history', { method: 'DELETE' })
```

**Option B:** Keep using `fetch()` - it will work with Next.js routes until you migrate that endpoint

### Phase 3: Authentication

Currently, the API client expects JWT tokens in `localStorage.getItem('auth_token')`.

**For FastAPI endpoints:**
- Users need to authenticate via FastAPI `/api/auth/login` or `/api/auth/guest`
- Token is stored in localStorage

**For Next.js routes:**
- Continue using NextAuth (current behavior)

**Future:** You can bridge NextAuth sessions to JWT tokens if needed (see TODO in `lib/api-client.ts`)

## Testing

1. Start FastAPI backend:
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8000
   ```

2. Start Next.js frontend:
   ```bash
   pnpm dev
   ```

3. Test endpoints:
   - With `NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat`: Chat should go to FastAPI
   - Other endpoints should still use Next.js routes

## Example: Migrating Chat Endpoint

1. **Backend**: Implement `/api/chat` in FastAPI (already has stub)

2. **Frontend**: Already updated! The chat component uses `getApiUrl("/api/chat")` which routes to FastAPI when configured

3. **Test**: Set `NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat` and test chat functionality

4. **Verify**: Check browser network tab - requests should go to `http://localhost:8000/api/chat`

## Troubleshooting

### Requests still going to Next.js routes
- Check environment variables are set correctly
- Restart Next.js dev server after changing env vars
- Check browser console for errors

### Authentication errors with FastAPI
- Ensure JWT token is in localStorage: `localStorage.getItem('auth_token')`
- Check FastAPI backend is running
- Verify CORS is configured in FastAPI

### Mixed routing (some requests to FastAPI, some to Next.js)
- This is expected! Only endpoints in `NEXT_PUBLIC_FASTAPI_ENDPOINTS` go to FastAPI
- Or set `NEXT_PUBLIC_USE_FASTAPI_BACKEND=true` to route all endpoints

## Next Steps

1. ✅ API client created
2. ✅ Core utilities updated
3. ⏭️ Implement FastAPI endpoints one by one
4. ⏭️ Update direct fetch calls as needed
5. ⏭️ Handle authentication bridge (NextAuth → JWT)
6. ⏭️ Test thoroughly
7. ⏭️ Deploy incrementally

## Comparison: Full Migration vs Patching

| Aspect | Full Migration | Patching Approach |
|--------|----------------|-------------------|
| **Time** | 2-3 weeks | 1-2 days setup, then incremental |
| **Risk** | High (all at once) | Low (one endpoint at a time) |
| **Rollback** | Difficult | Easy (env var change) |
| **Testing** | Test everything | Test one endpoint at a time |
| **Complexity** | High | Low |

The patching approach is **much simpler** and **less risky** for your use case!
