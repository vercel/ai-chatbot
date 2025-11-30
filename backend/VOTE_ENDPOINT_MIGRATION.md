# Vote Endpoint Migration Guide

## ✅ Implementation Complete

The Vote endpoint has been fully implemented in FastAPI. Here's what was created:

### Files Created/Updated

1. **Models** (`backend/app/models/`)
   - `chat.py` - Chat SQLAlchemy model
   - `vote.py` - Vote SQLAlchemy model
   - `__init__.py` - Model exports

2. **Database Queries** (`backend/app/db/queries/`)
   - `chat_queries.py` - Chat lookup function
   - `vote_queries.py` - Vote operations (get and create/update)

3. **API Endpoint** (`backend/app/api/v1/vote.py`)
   - Fully implemented GET and PATCH endpoints
   - Proper error handling with ChatSDKError
   - Authentication and authorization checks

4. **Error Handling** (`backend/app/core/errors.py`)
   - Added vote-specific error messages

## Testing the Migration

### 1. Set Environment Variable

Add to `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

### 2. Start FastAPI Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### 3. Start Next.js Frontend

```bash
# In project root
pnpm dev
```

### 4. Test the Endpoint

1. **Open the app** in browser: http://localhost:3000
2. **Create a chat** and send a message
3. **Click the upvote/downvote buttons** on an assistant message
4. **Check browser network tab** - requests should go to `http://localhost:8000/api/vote`
5. **Verify votes appear** correctly

### 5. Verify in FastAPI Docs

Visit http://localhost:8000/docs and test the endpoints:
- `GET /api/vote?chatId={uuid}` - Get votes
- `PATCH /api/vote` - Vote on message

## Expected Behavior

### GET `/api/vote?chatId={id}`
- Returns array of votes for the chat
- Format: `[{"chatId": "...", "messageId": "...", "isUpvoted": true/false}]`
- Requires authentication
- Validates chat belongs to user

### PATCH `/api/vote`
- Request body: `{"chatId": "...", "messageId": "...", "type": "up" | "down"}`
- Returns: `{"status": "voted"}`
- Creates or updates vote
- Requires authentication
- Validates chat belongs to user

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `POSTGRES_URL` in backend `.env`
- Verify database has `Chat` and `Vote_v2` tables

### Authentication Issues
- FastAPI expects JWT token in `Authorization: Bearer {token}` header
- Token should be in `localStorage.getItem('auth_token')`
- If using NextAuth, you'll need to bridge the session to JWT (future work)

### CORS Issues
- Ensure `CORS_ORIGINS` in backend `.env` includes `http://localhost:3000`

### Model Import Errors
- Make sure all models are imported in `backend/app/models/__init__.py`
- Check that `Base` is properly configured in `backend/app/core/database.py`

## Next Steps

Once vote endpoint is working:
1. Test thoroughly
2. Add more endpoints: `NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,files`
3. Continue with other endpoints (history, document, chat)

## Notes

- The implementation matches the Next.js route behavior exactly
- Error messages use ChatSDKError for consistency
- Database queries use async SQLAlchemy
- UUIDs are handled as Python UUID objects, converted to strings for responses

