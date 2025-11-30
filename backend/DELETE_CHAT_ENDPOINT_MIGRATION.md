# DELETE Chat Endpoint Migration

## ✅ Implementation Complete

The DELETE `/api/chat?id={id}` endpoint has been successfully migrated from Next.js to FastAPI.

## Implementation Details

### Endpoint

**DELETE `/api/chat?id={id}`**
- **Purpose**: Delete a single chat by ID (cascade delete)
- **Query Parameters**: `id` (UUID) - Chat ID to delete
- **Response**: Deleted chat object
- **Authentication**: Required (JWT token)

### Database Query

#### `delete_chat_by_id()`
Located in `backend/app/db/queries/chat_queries.py`:
- Deletes a single chat by ID
- Cascade deletes related records:
  - Votes (from `Vote_v2` table)
  - Messages (from `Message_v2` table)
  - Streams (from `Stream` table)
- Returns the deleted Chat object

### Endpoint Implementation

Located in `backend/app/api/v1/chat.py`:
- Validates chat exists
- Checks user ownership (authorization)
- Performs cascade deletion
- Returns deleted chat in frontend-compatible format

### Response Format

```json
{
  "id": "uuid-string",
  "title": "string",
  "createdAt": "ISO-8601-datetime-string",
  "visibility": "private" | "public",
  "userId": "uuid-string",
  "lastContext": null | object
}
```

## Frontend Integration

✅ **Already using `apiFetch`** - The frontend in `components/sidebar-history.tsx` already uses `apiFetch()` for delete operations, so it will automatically route to FastAPI when configured.

## Testing

### Manual Testing Steps

1. **Start the FastAPI backend**:
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8001
   ```

2. **Configure frontend** to use FastAPI for chat endpoint:
   ```bash
   # In .env.local
   NEXT_PUBLIC_USE_FASTAPI_BACKEND=false
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=chat
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

3. **Test DELETE endpoint**:
   - Open the app sidebar
   - Click delete icon on any chat
   - Verify chat is deleted
   - Check browser network tab for `/api/chat?id=...` DELETE request

### Expected Behavior

- Chat should be deleted from the sidebar
- Related votes, messages, and streams should also be deleted
- Only the chat owner can delete their chat
- Returns 404 if chat doesn't exist
- Returns 403 if user doesn't own the chat

## Migration Status

✅ **Completed**:
- DELETE `/api/chat` endpoint
- Database query function (`delete_chat_by_id`)
- Cascade deletion logic
- Authentication and authorization
- Frontend integration (already using `apiFetch`)

## Notes

- The endpoint follows the same pattern as `delete_all_chats_by_user_id`
- Cascade deletion ensures data consistency
- Frontend already uses `apiFetch`, so no frontend changes needed
- Response format matches Next.js implementation

## Related Endpoints

- ✅ `DELETE /api/history` - Delete all chats (already migrated)
- ✅ `DELETE /api/chat?id={id}` - Delete single chat (just migrated)
- ⏳ `POST /api/chat` - Create/continue chat (complex, needs streaming)

