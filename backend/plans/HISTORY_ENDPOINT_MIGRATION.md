# History Endpoint Migration

## Overview
The History endpoint (`/api/history`) has been successfully migrated from Next.js to FastAPI. This endpoint handles fetching paginated chat history and deleting all chats for a user.

## Implementation Details

### Endpoints

#### GET `/api/history`
- **Purpose**: Get paginated chat history for the current user
- **Query Parameters**:
  - `limit` (int, default: 10, min: 1, max: 100): Number of chats to return
  - `starting_after` (UUID, optional): Get chats created after this chat ID
  - `ending_before` (UUID, optional): Get chats created before this chat ID
- **Response**: `{ chats: Chat[], hasMore: boolean }`
- **Authentication**: Required (JWT token)

#### DELETE `/api/history`
- **Purpose**: Delete all chats for the current user (cascade delete)
- **Response**: `{ deletedCount: int }`
- **Authentication**: Required (JWT token)

### Database Queries

#### `get_chats_by_user_id()`
Located in `backend/app/db/queries/chat_queries.py`:
- Fetches chats for a user with pagination support
- Handles `starting_after` (newer chats) and `ending_before` (older chats)
- Returns chats ordered by `createdAt` descending (newest first)
- Uses extended limit (+1) to determine if there are more results

#### `delete_all_chats_by_user_id()`
Located in `backend/app/db/queries/chat_queries.py`:
- Deletes all chats for a user
- Cascade deletes related records:
  - Votes (from `Vote_v2` table)
  - Messages (from `Message_v2` table)
  - Streams (from `Stream` table)
- Returns the count of deleted chats

### Models

#### Stream Model
Created `backend/app/models/stream.py`:
- Represents the `Stream` table
- Fields: `id`, `chatId`, `createdAt`
- Used for cascade deletion when deleting chats

### Response Format

The GET endpoint returns chats in the following format:
```json
{
  "chats": [
    {
      "id": "uuid-string",
      "title": "string",
      "createdAt": "ISO-8601-datetime-string",
      "visibility": "private" | "public",
      "userId": "uuid-string",
      "lastContext": null | object
    }
  ],
  "hasMore": boolean
}
```

## Testing

### Manual Testing Steps

1. **Start the FastAPI backend**:
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8001
   ```

2. **Configure frontend** to use FastAPI for history endpoint:
   ```bash
   # In .env.local
   NEXT_PUBLIC_USE_FASTAPI_BACKEND=false
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=history
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

3. **Test GET endpoint**:
   - Open the app sidebar
   - Verify chat history loads correctly
   - Test pagination by scrolling
   - Check browser network tab for `/api/history` requests

4. **Test DELETE endpoint**:
   - Click "Delete All Chats" button in sidebar
   - Verify all chats are deleted
   - Verify related records (votes, messages, streams) are also deleted

### Expected Behavior

- Chat history should load in the sidebar
- Pagination should work correctly (loads more chats when scrolling)
- Delete all should remove all chats and related data
- Response format should match Next.js implementation

## Migration Status

✅ **Completed**:
- GET `/api/history` endpoint
- DELETE `/api/history` endpoint
- Database query functions
- Stream model creation
- Cascade deletion logic

## Notes

- The endpoint requires authentication via JWT token
- Pagination uses cursor-based approach with `starting_after` and `ending_before`
- All datetime fields are serialized as ISO-8601 strings
- The `lastContext` field can be `null` or a JSON object
