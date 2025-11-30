# FastAPI Endpoints Reference for NEXT_PUBLIC_FASTAPI_ENDPOINTS

## Available Endpoint Names

You can use these endpoint names in `NEXT_PUBLIC_FASTAPI_ENDPOINTS`:

### ✅ Available Endpoints

1. **`vote`** - Vote endpoints
   - Routes: `/api/vote` (GET, PATCH)
   - Status: ✅ Fully implemented

2. **`chat`** - Chat endpoints
   - Routes: `/api/chat` (POST, DELETE)
   - Status: 🚧 Stub (placeholder implementation)

3. **`history`** - Chat history endpoints
   - Routes: `/api/history` (GET, DELETE)
   - Status: 🚧 Stub (placeholder implementation)

4. **`document`** - Document endpoints
   - Routes: `/api/document` (GET, POST, DELETE)
   - Status: 🚧 Stub (placeholder implementation)

5. **`files`** - File upload endpoints
   - Routes: `/api/files/upload` (POST)
   - Status: ✅ Partially implemented (upload works)

6. **`auth`** - Authentication endpoints
   - Routes: `/api/auth/*` (login, register, guest)
   - Status: 🚧 Stub (placeholder implementation)
   - Note: Not recommended until NextAuth bridge is implemented

## Usage Examples

### Single Endpoint

```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

This routes only `/api/vote` requests to FastAPI.

### Multiple Endpoints

```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,history,files
```

This routes `/api/vote`, `/api/history`, and `/api/files` to FastAPI.

### All Endpoints

```env
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

This routes ALL `/api/*` endpoints to FastAPI (ignores `NEXT_PUBLIC_FASTAPI_ENDPOINTS`).

## How It Works

The routing logic checks if the endpoint URL includes `/api/{endpoint_name}`:

- `vote` matches: `/api/vote`, `/api/vote?chatId=...`
- `history` matches: `/api/history`, `/api/history?limit=10`
- `chat` matches: `/api/chat`, `/api/chat?id=...`
- `document` matches: `/api/document`, `/api/document?id=...`
- `files` matches: `/api/files/upload`, `/api/files/*`
- `auth` matches: `/api/auth/login`, `/api/auth/register`, `/api/auth/*`

## Recommended Migration Order

### Phase 1: Start Simple
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

### Phase 2: Add More
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,files
```

### Phase 3: Continue Migration
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,files,history
```

### Phase 4: Most Endpoints
```env
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,files,history,document
```

### Phase 5: All Endpoints (Final)
```env
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

## Endpoint Details

### `vote`
- **GET** `/api/vote?chatId={id}` - Get votes for a chat
- **PATCH** `/api/vote` - Vote on a message
- **Implementation**: ✅ Complete
- **Auth Required**: Yes (but can be disabled for testing)

### `chat`
- **POST** `/api/chat` - Create/continue chat (streaming)
- **DELETE** `/api/chat?id={id}` - Delete chat
- **Implementation**: 🚧 Stub
- **Auth Required**: Yes

### `history`
- **GET** `/api/history?limit=10&ending_before={id}` - Get chat history
- **DELETE** `/api/history` - Delete all chats
- **Implementation**: 🚧 Stub
- **Auth Required**: Yes

### `document`
- **GET** `/api/document?id={id}` - Get document
- **POST** `/api/document?id={id}` - Create/update document
- **DELETE** `/api/document?id={id}&timestamp={ts}` - Delete document version
- **Implementation**: 🚧 Stub
- **Auth Required**: Yes

### `files`
- **POST** `/api/files/upload` - Upload file to blob storage
- **Implementation**: ✅ Complete (upload works)
- **Auth Required**: Yes

### `auth`
- **POST** `/api/auth/login` - Login
- **POST** `/api/auth/register` - Register
- **POST** `/api/auth/guest` - Create guest user
- **Implementation**: 🚧 Stub
- **Note**: Not recommended until you migrate from NextAuth

## Quick Reference

| Endpoint Name | Routes | Status | Auth |
|--------------|--------|--------|------|
| `vote` | `/api/vote` | ✅ Complete | Yes |
| `files` | `/api/files/*` | ✅ Partial | Yes |
| `chat` | `/api/chat` | 🚧 Stub | Yes |
| `history` | `/api/history` | 🚧 Stub | Yes |
| `document` | `/api/document` | 🚧 Stub | Yes |
| `auth` | `/api/auth/*` | 🚧 Stub | N/A |

## Example Configurations

### Testing Vote Endpoint Only
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote
```

### Testing Multiple Endpoints
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote,files,history
```

### All Endpoints to FastAPI
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

## Notes

- Endpoint names are **case-sensitive** - use lowercase
- Use **comma-separated** list (no spaces): `vote,history`
- The routing matches any URL that **includes** `/api/{endpoint_name}`
- Order doesn't matter: `vote,history` = `history,vote`
- If `NEXT_PUBLIC_USE_FASTAPI_BACKEND=true`, all endpoints go to FastAPI (ignores the list)

