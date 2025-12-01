# Chat POST Endpoint - Hybrid Implementation

## ✅ Implementation Complete

The hybrid approach for POST `/api/chat` has been successfully implemented!

## Architecture

```
Frontend
   │
   ├─→ FastAPI POST /api/chat
   │      │
   │      ├─→ Database Operations (FastAPI)
   │      │   ✅ Rate limiting check
   │      │   ✅ Get/create chat
   │      │   ✅ Fetch existing messages
   │      │   ✅ Save user message
   │      │   ✅ Create stream ID
   │      │
   │      └─→ Proxy to Next.js POST /api/chat/stream
   │             │
   │             └─→ Next.js AI Streaming
   │                 ✅ AI SDK streaming
   │                 ✅ Tools (getWeather, createDocument, etc.)
   │                 ✅ Save assistant messages
   │                 ✅ Update chat context
   │
   └─→ FastAPI returns SSE stream (proxied from Next.js)
```

## What Was Implemented

### 1. Database Query Functions (`backend/app/db/queries/chat_queries.py`)

✅ **All query functions implemented**:
- `get_messages_by_chat_id()` - Fetch messages for a chat
- `save_chat()` - Create new chat
- `save_messages()` - Save multiple messages
- `create_stream_id()` - Create stream ID entry
- `update_chat_last_context_by_id()` - Update usage context
- `get_message_count_by_user_id()` - Rate limiting

### 2. FastAPI Endpoint (`backend/app/api/v1/chat.py`)

✅ **POST `/api/chat` endpoint**:
- Request validation (Pydantic models)
- Authentication check
- Rate limiting (20 for guest, 100 for regular)
- Chat get/create logic
- Message fetching
- User message saving
- Proxy to Next.js for AI streaming
- SSE stream proxying

### 3. Next.js Proxy Endpoint (`app/api/chat/stream/route.ts`)

✅ **POST `/api/chat/stream` endpoint**:
- Receives request from FastAPI
- Uses existingMessages from request (no DB fetch)
- Streams AI response (same as original endpoint)
- Saves assistant messages on completion
- Updates chat context with usage

### 4. Configuration (`backend/app/config.py`)

✅ **Added `NEXTJS_URL` setting**:
- Default: `http://localhost:3000`
- Configurable via environment variable

## Request Flow

### 1. Frontend → FastAPI
```json
POST /api/chat
{
  "id": "uuid",
  "message": {
    "id": "uuid",
    "role": "user",
    "parts": [...]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "private"
}
```

### 2. FastAPI Processing
- Validates request
- Checks rate limits
- Gets/creates chat
- Fetches existing messages
- Saves user message
- Creates stream ID

### 3. FastAPI → Next.js
```json
POST /api/chat/stream
{
  "id": "uuid",
  "message": {...},
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "private",
  "existingMessages": [...]
}
```

### 4. Next.js Streaming
- Streams AI response (SSE)
- Handles tools
- Saves assistant messages
- Updates chat context

### 5. FastAPI → Frontend
- Proxies SSE stream
- Returns to frontend

## Configuration

### Environment Variables

**FastAPI (`backend/.env`)**:
```env
NEXTJS_URL=http://localhost:3000  # Next.js server URL
```

**Frontend (`.env.local`)**:
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Testing

### Manual Testing Steps

1. **Start Next.js server**:
   ```bash
   pnpm dev
   # Should be running on http://localhost:3000
   ```

2. **Start FastAPI backend**:
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8001
   ```

3. **Configure frontend**:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

4. **Test chat**:
   - Open the app
   - Send a message
   - Verify:
     - Message is saved
     - AI response streams
     - Chat is created/updated
     - Rate limiting works

### Expected Behavior

- ✅ Chat creation works
- ✅ Message persistence works
- ✅ AI streaming works
- ✅ Tools work (getWeather, createDocument, etc.)
- ✅ Rate limiting enforced
- ✅ Usage tracking works

## Benefits of Hybrid Approach

1. **Faster Implementation** ✅
   - Database operations in FastAPI (3-4 hours vs 8-12 hours)
   - AI streaming stays in proven Next.js code

2. **Lower Risk** ✅
   - No need to migrate AI SDK
   - Tools continue to work
   - Can test incrementally

3. **Incremental Migration** ✅
   - Can migrate AI logic later if needed
   - Database already migrated
   - Flexible architecture

## Known Limitations

1. **Title Generation**: Currently uses placeholder "New Chat"
   - Can be added later as async background task
   - Or generate in Next.js and update via API

2. **Geolocation**: Uses Vercel Functions geolocation
   - Works in Next.js endpoint
   - May need alternative for FastAPI if deployed separately

3. **Resumable Streams**: Not implemented
   - Commented out in original Next.js code
   - Can be added later if needed

## Next Steps

1. **Test the implementation** end-to-end
2. **Add title generation** (optional, can be async)
3. **Monitor performance** of proxy
4. **Consider full migration** later if needed

## Files Modified

1. `backend/app/db/queries/chat_queries.py` - Added query functions
2. `backend/app/api/v1/chat.py` - Implemented POST endpoint with proxy
3. `backend/app/config.py` - Added NEXTJS_URL setting
4. `app/api/chat/stream/route.ts` - New proxy endpoint for FastAPI

## Migration Status

✅ **Phase 1 Complete**: Database operations in FastAPI
✅ **Phase 2 Complete**: Proxy to Next.js implemented
✅ **Phase 3 Complete**: Message saving integration

**Ready for testing!** 🎉

