# File Storage Migration: Vercel Blob → PostgreSQL BYTEA

This document describes the migration from Vercel Blob storage to PostgreSQL BYTEA storage for file uploads.

## Overview

Files are now stored directly in PostgreSQL using the `BYTEA` column type instead of using Vercel Blob storage. This eliminates the need for external blob storage and keeps all data in one database.

## Changes Made

### 1. Database Model (`backend/app/models/file.py`)

Created a new `File` model with:
- `id`: UUID primary key
- `filename`: Original filename
- `contentType`: MIME type (e.g., "image/jpeg")
- `data`: BYTEA column storing binary file data
- `size`: File size in bytes
- `userId`: Optional foreign key to User table
- `createdAt`: Timestamp

### 2. Database Migration

Created migration: `11697a81b452_add_file_table.py`

To apply:
```bash
cd backend
uv run alembic upgrade head
```

### 3. API Endpoints (`backend/app/api/v1/files.py`)

#### POST `/api/files/upload`
- Uploads file to PostgreSQL
- Validates file size (5MB max) and type (JPEG/PNG)
- Stores file data in BYTEA column
- Returns file URL for retrieval

**Response format** (compatible with Vercel Blob response):
```json
{
  "url": "/api/files/{file_id}",
  "pathname": "{file_id}",
  "contentType": "image/jpeg"
}
```

#### GET `/api/files/{file_id}`
- Retrieves file by ID
- Returns file as binary response with proper content-type headers
- Supports inline display in browsers

### 4. Updated Models

- Added `File` to `backend/app/models/__init__.py`
- Added `files` relationship to `User` model

## Usage

### Upload File

```bash
curl -X POST http://localhost:8000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"
```

### Retrieve File

```bash
# Direct URL (works in browser)
http://localhost:8000/api/files/{file_id}

# Or via curl
curl http://localhost:8000/api/files/{file_id}
```

## Frontend Integration

The frontend route at `app/(chat)/api/files/upload/route.ts` currently uses Vercel Blob. To use the PostgreSQL storage:

1. **Option A**: Update the route to proxy to FastAPI:
```typescript
// Proxy to FastAPI backend
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

2. **Option B**: Configure frontend to route file endpoints to FastAPI:
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=files
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Benefits

✅ **Single Database**: All data in one place
✅ **No External Dependencies**: No need for Vercel Blob token
✅ **ACID Transactions**: File operations can be transactional
✅ **Simpler Architecture**: One less service to manage
✅ **Cost Savings**: No additional storage service fees

## Limitations

⚠️ **Database Size**: Files increase database size
⚠️ **Performance**: Large files can slow queries
⚠️ **Backup Size**: Database backups include all files
⚠️ **No CDN**: Files served directly from database (no CDN caching)
⚠️ **Memory Usage**: Loading large files into memory

## Recommendations

For production with high file volume:
- Consider using PostgreSQL Large Objects for files > 1MB
- Implement file cleanup/deletion endpoints
- Add file size monitoring
- Consider hybrid approach: metadata in PostgreSQL, files in object storage

## Migration Steps

1. ✅ Create File model
2. ✅ Create database migration
3. ✅ Update API endpoints
4. ⏳ Run migration: `uv run alembic upgrade head`
5. ⏳ Update frontend to use FastAPI endpoints (optional)
6. ⏳ Remove Vercel Blob dependency (optional, can keep for fallback)

## Rollback

If needed, you can rollback the migration:

```bash
cd backend
uv run alembic downgrade -1
```

Then restore the old `files.py` endpoint code that uses Vercel Blob.
