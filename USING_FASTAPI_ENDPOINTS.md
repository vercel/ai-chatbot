# How to Use FastAPI Endpoints

This guide shows you how to start using the FastAPI backend endpoints with your frontend.

## Quick Start

### 1. Start FastAPI Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (Interactive API documentation)
- **Health**: http://localhost:8000/health

### 2. Configure Frontend to Use FastAPI

Create or update `.env.local` in the **project root** (not backend directory):

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Route specific endpoints to FastAPI
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

### 3. Start Next.js Frontend

```bash
# In project root (not backend directory)
pnpm dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3000

## Testing the Vote Endpoint

### Option 1: Test via Frontend

1. Open http://localhost:3000
2. Create a chat and send a message
3. Click the upvote/downvote buttons on an assistant message
4. Check browser Network tab - requests should go to `http://localhost:8000/api/vote`

### Option 2: Test via FastAPI Docs

1. Open http://localhost:8000/docs
2. Find the `/api/vote` endpoints
3. Click "Try it out"
4. Enter test data and execute

### Option 3: Test via curl

```bash
# Get votes (requires authentication)
curl http://localhost:8000/api/vote?chatId=YOUR_CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Vote on message (requires authentication)
curl -X PATCH http://localhost:8000/api/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "chatId": "YOUR_CHAT_ID",
    "messageId": "YOUR_MESSAGE_ID",
    "type": "up"
  }'
```

## Available Endpoints

### ✅ Vote Endpoint (Implemented)

- `GET /api/vote?chatId={id}` - Get votes for a chat
- `PATCH /api/vote` - Vote on a message

**Status**: Fully implemented and ready to use

### 🚧 Other Endpoints (Stubs)

- `/api/auth/*` - Authentication (placeholder)
- `/api/chat` - Chat streaming (placeholder)
- `/api/history` - Chat history (placeholder)
- `/api/document` - Documents (placeholder)
- `/api/files/upload` - File uploads (partially implemented)

## Routing Configuration

### Route All Endpoints to FastAPI

```env
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

### Route Specific Endpoints Only

```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,history,files
```

This routes only `vote`, `history`, and `files` endpoints to FastAPI. Others use Next.js routes.

## Authentication

### Current Status

The vote endpoint requires JWT authentication, but you're using NextAuth. You have two options:

### Option 1: Temporarily Disable Auth (For Testing)

Edit `backend/app/api/v1/vote.py` and comment out auth:

```python
@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    # current_user: dict = Depends(get_current_user),  # Comment out
    db: AsyncSession = Depends(get_db)
):
    # Skip auth checks for now
```

### Option 2: Implement NextAuth → JWT Bridge

See `NEXTAUTH_JWT_BRIDGE.md` for implementation guide.

## Troubleshooting

### "Connection refused" Error

- Make sure FastAPI is running: `uv run uvicorn app.main:app --reload --port 8000`
- Check the port matches `NEXT_PUBLIC_API_URL`

### "401 Unauthorized" Error

- Vote endpoint requires JWT authentication
- Either disable auth temporarily or implement the bridge
- Check browser console for authentication errors

### "404 Not Found" Error

- Verify endpoint is in `NEXT_PUBLIC_FASTAPI_ENDPOINTS`
- Check FastAPI is running and endpoint exists
- Visit http://localhost:8000/docs to see available endpoints

### CORS Errors

- Ensure `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`
- Restart FastAPI server after changing CORS settings

### Database Connection Errors

- Verify `POSTGRES_URL` in `backend/.env` uses `postgresql+asyncpg://` format
- Check database is accessible
- Ensure tables exist (Chat, Vote_v2, User, etc.)

## Verifying It's Working

### Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "vote" or "api"
4. Click upvote/downvote button
5. You should see requests to `http://localhost:8000/api/vote`

### Check FastAPI Logs

In the terminal where FastAPI is running, you should see:
```
INFO:     127.0.0.1:xxxxx - "PATCH /api/vote HTTP/1.1" 200 OK
```

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Should return: `{"status":"ok","version":"1.0.0"}`

## Next Steps

1. ✅ Test vote endpoint
2. ⏭️ Implement NextAuth → JWT bridge (if needed)
3. ⏭️ Migrate more endpoints (history, document, etc.)
4. ⏭️ Test thoroughly
5. ⏭️ Deploy

## Example: Testing Vote Endpoint

### 1. Start Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Configure Frontend

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

### 3. Start Frontend

```bash
pnpm dev
```

### 4. Test

- Open http://localhost:3000
- Create a chat
- Send a message
- Vote on the assistant's response
- Check Network tab - should see request to FastAPI

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You can test all endpoints directly from the browser!

