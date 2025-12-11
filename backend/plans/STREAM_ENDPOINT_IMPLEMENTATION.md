# Stream Endpoint Implementation

## Overview

Created a new `/api/v1/chat/stream` endpoint in FastAPI that handles AI streaming using aisuite + OpenAI. The POST `/api/chat` endpoint now calls this internal stream endpoint instead of proxying to Next.js.

## Architecture

### Flow

1. **Frontend** → POST `/api/chat` (FastAPI)
   - Handles rate limiting
   - Creates/validates chat
   - Saves user message
   - Creates stream ID

2. **POST `/api/chat`** → Internal HTTP call → `/api/v1/chat/stream` (FastAPI)
   - Streams AI response using aisuite
   - Formats output as Vercel AI SDK SSE events
   - Saves assistant messages
   - Updates chat context with usage

3. **Stream response** → Frontend
   - Receives SSE events in Vercel AI SDK format

## Files Created/Modified

### New Files

1. **`app/api/v1/chat_stream.py`**
   - New stream endpoint at `/api/v1/chat/stream`
   - Uses aisuite for AI provider abstraction
   - Formats output as Vercel AI SDK SSE events
   - Handles message saving and usage tracking

2. **`app/ai/client.py`**
   - AI client wrapper using aisuite
   - Model name mapping

3. **`app/utils/stream.py`**
   - Streaming utility adapting aisuite to Vercel format
   - Based on Vercel Python streaming reference

### Modified Files

1. **`app/api/v1/chat.py`**
   - Updated to call FastAPI stream endpoint instead of Next.js
   - Changed proxy URL from Next.js to internal FastAPI endpoint

2. **`app/main.py`**
   - Added `chat_stream` router

3. **`app/config.py`**
   - Added `OPENAI_API_KEY` (kept `XAI_API_KEY` for backward compatibility)

4. **`pyproject.toml`**
   - Added `aisuite` dependency

## Current Status

✅ **Completed:**
- Stream endpoint created
- POST endpoint updated to use FastAPI stream
- System prompts ported
- Message conversion to OpenAI format
- Basic streaming without tools

⏳ **Pending:**
- Port tools (getWeather, createDocument, updateDocument, requestSuggestions)
- Add geolocation hints support
- Test end-to-end streaming

## Usage

### Environment Variables

```bash
# backend/.env
OPENAI_API_KEY=sk-...
```

### Testing

1. **Start FastAPI server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8001
   ```

2. **Test stream endpoint directly:**
   ```bash
   curl -X POST http://localhost:8001/api/v1/chat/stream \
     -H "Content-Type: application/json" \
     -H "Cookie: auth_token=..." \
     -d '{
       "id": "...",
       "message": {
         "id": "...",
         "role": "user",
         "parts": [{"type": "text", "text": "Hello!"}]
       },
       "selectedChatModel": "chat-model",
       "selectedVisibilityType": "private",
       "existingMessages": []
     }'
   ```

3. **Test via POST endpoint:**
   ```bash
   curl -X POST http://localhost:8001/api/chat \
     -H "Content-Type: application/json" \
     -H "Cookie: auth_token=..." \
     -d '{
       "id": "...",
       "message": {
         "id": "...",
         "role": "user",
         "parts": [{"type": "text", "text": "Hello!"}]
       },
       "selectedChatModel": "chat-model",
       "selectedVisibilityType": "private"
     }'
   ```

## Next Steps

1. **Port Tools:**
   - `getWeather` - Easy (HTTP calls)
   - `createDocument` - Medium (DB + SSE events)
   - `updateDocument` - Medium (DB + SSE events)
   - `requestSuggestions` - Complex (structured output)

2. **Add Geolocation:**
   - Get geolocation hints from request headers
   - Pass to system prompt

3. **Testing:**
   - Test with frontend
   - Verify SSE format compatibility
   - Test tool execution

## Benefits

- ✅ **Incremental Migration:** POST endpoint unchanged, only stream source swapped
- ✅ **Provider Abstraction:** Using aisuite for easy provider switching
- ✅ **Format Compatibility:** Output matches Vercel AI SDK format
- ✅ **Clean Architecture:** Separation of concerns (DB vs AI)
