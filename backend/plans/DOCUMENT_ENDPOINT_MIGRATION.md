# Document Endpoint Migration

## Summary

Successfully migrated the `/api/document` endpoint from Next.js to FastAPI.

## What Was Implemented

### 1. SQLAlchemy Model (`backend/app/models/document.py`)
- Created `Document` model with composite primary key `(id, createdAt)`
- Fields: `id`, `created_at`, `title`, `content`, `kind`, `user_id`
- `kind` enum: `"text"`, `"code"`, `"image"`, `"sheet"`
- Relationship with `User` model

### 2. Database Queries (`backend/app/db/queries/document_queries.py`)
- `get_documents_by_id()` - Get all versions of a document (ordered by creation time)
- `save_document()` - Create a new document version
- `delete_documents_by_id_after_timestamp()` - Delete document versions after a timestamp

### 3. FastAPI Endpoints (`backend/app/api/v1/document.py`)

#### GET `/api/document?id={id}`
- Returns all versions of a document ordered by creation time
- Validates user ownership
- Returns array of document objects

#### POST `/api/document?id={id}`
- Creates a new document version (new timestamp, same ID)
- Validates `kind` enum
- Validates user ownership if document exists
- Returns the created document

#### DELETE `/api/document?id={id}&timestamp={timestamp}`
- Deletes all document versions after a specific timestamp
- Validates timestamp format (ISO 8601)
- Validates user ownership
- Returns array of deleted documents

### 4. Error Handling
- Added document-specific error codes to `backend/app/core/errors.py`:
  - `not_found:document`
  - `unauthorized:document`
  - `forbidden:document`

### 5. Frontend Integration
- ✅ GET already uses `fetcher` (which uses API client)
- ✅ POST already uses `apiFetch` in `components/artifact.tsx`
- ✅ DELETE already uses `apiFetch` in `components/version-footer.tsx`

## Database Schema

The `Document` table uses a composite primary key `(id, createdAt)` to support versioning:
- Same `id` can have multiple versions (different `createdAt` timestamps)
- Each version is a separate row in the database
- Versions are ordered by `createdAt` ascending

## API Contract

### Request/Response Formats

**GET Response:**
```json
[
  {
    "id": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "title": "Document Title",
    "content": "Document content...",
    "kind": "text",
    "userId": "uuid"
  }
]
```

**POST Request:**
```json
{
  "title": "Document Title",
  "content": "Document content...",
  "kind": "text"
}
```

**POST Response:**
```json
{
  "id": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "title": "Document Title",
  "content": "Document content...",
  "kind": "text",
  "userId": "uuid"
}
```

**DELETE Response:**
```json
[
  {
    "id": "uuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "title": "Document Title",
    "content": "Document content...",
    "kind": "text",
    "userId": "uuid"
  }
]
```

## Testing

To test the migration:

1. **Set environment variable:**
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=document
   ```

2. **Test GET:**
   - Create a document via chat
   - View document in artifact component
   - Should fetch all versions from FastAPI

3. **Test POST:**
   - Edit document content in artifact component
   - Should create new version via FastAPI

4. **Test DELETE:**
   - View previous version of document
   - Click "Restore this version"
   - Should delete newer versions via FastAPI

## Notes

- Document versioning is handled by creating new rows with the same `id` but different `createdAt` timestamps
- The `kind` field must be one of: `"text"`, `"code"`, `"image"`, `"sheet"`
- All endpoints require authentication via JWT
- User ownership is validated for all operations
