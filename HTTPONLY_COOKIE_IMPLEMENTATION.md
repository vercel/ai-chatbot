# httpOnly Cookie Implementation

## ✅ Implementation Complete

The JWT token storage has been migrated from localStorage to httpOnly cookies for improved security.

## What Changed

### 1. JWT Bridge Endpoint (`app/api/auth/jwt-bridge/route.ts`)
- **Before**: Returned `{ access_token: "..." }` as JSON
- **After**: Sets httpOnly cookie named `auth_token` and returns `{ success: true }`
- Cookie settings:
  - `httpOnly: true` - Not accessible to JavaScript (XSS protection)
  - `secure: true` in production - Only sent over HTTPS
  - `sameSite: "lax"` - CSRF protection
  - `maxAge: 30 minutes` - Matches token expiration

### 2. API Client (`lib/api-client.ts`)
- **Before**: Stored token in localStorage, manually added to Authorization header
- **After**:
  - Removed localStorage logic
  - Cookies are automatically sent with requests
  - Calls bridge endpoint to ensure cookie exists
  - Uses `credentials: "include"` for cross-origin requests

### 3. FastAPI Authentication (`backend/app/api/deps.py`)
- **Before**: Only read from Authorization header
- **After**:
  - Checks cookies first (httpOnly cookie)
  - Falls back to Authorization header (backward compatibility)
  - Updated `get_current_user` and `get_optional_user` to accept `Request`

## Security Improvements

✅ **XSS Protection**: Tokens are no longer accessible to JavaScript
✅ **Automatic Transmission**: Cookies are automatically sent with requests
✅ **CSRF Protection**: `sameSite: "lax"` prevents cross-site attacks
✅ **HTTPS Only**: `secure: true` in production ensures encrypted transmission

## How It Works

```
┌─────────────┐
│   Frontend   │
│  (NextAuth) │
└──────┬──────┘
       │
       │ 1. User makes request to FastAPI
       │
       ▼
┌─────────────────────┐
│   apiFetch()        │
│  - Calls bridge to  │
│    ensure cookie    │
│  - Cookie auto-sent │
└──────┬──────────────┘
       │
       │ 2. GET /api/auth/jwt-bridge
       │    Sets httpOnly cookie
       │
       ▼
┌─────────────────────┐
│   FastAPI Request   │
│  - Cookie: auth_token=<token>
│  - credentials: include
└──────┬──────────────┘
       │
       │ 3. FastAPI reads from cookie
       │
       ▼
┌─────────────────────┐
│   FastAPI Endpoint   │
│  - Validates JWT    │
│  - Processes request
└─────────────────────┘
```

## Testing

### 1. Test Bridge Endpoint

```bash
# Should set cookie and return success
curl -v http://localhost:3000/api/auth/jwt-bridge \
  -H "Cookie: next-auth.session-token=..." \
  --cookie-jar cookies.txt

# Check response headers for Set-Cookie
# Should see: Set-Cookie: auth_token=...; HttpOnly; ...
```

### 2. Test with FastAPI

1. **Set environment variables**:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=history,vote
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

2. **Start FastAPI backend**:
   ```bash
   cd backend && uv run uvicorn app.main:app --reload --port 8001
   ```

3. **Use the frontend** - authentication should work automatically!

### 3. Verify Cookie in Browser

1. Open DevTools → Application → Cookies
2. Look for `auth_token` cookie
3. Verify it has:
   - ✅ HttpOnly flag (not accessible to JavaScript)
   - ✅ Secure flag (in production)
   - ✅ SameSite=Lax

## Backward Compatibility

The implementation maintains backward compatibility:
- FastAPI still accepts Authorization header (for API clients that use it)
- Cookies are checked first, then Authorization header
- Existing API clients using Authorization header will continue to work

## Migration Notes

### Removed localStorage
- No longer storing tokens in localStorage
- No manual token management needed
- Tokens are automatically managed by the browser

### Cookie Domain
- Cookies are set for the current domain
- For cross-origin requests, ensure CORS is configured correctly
- FastAPI CORS already has `allow_credentials=True`

## Troubleshooting

### Cookie Not Being Sent

1. **Check CORS configuration**:
   - FastAPI must have `allow_credentials=True` ✅ (already set)
   - Frontend must use `credentials: "include"` ✅ (already set)

2. **Check cookie domain**:
   - Cookies are set for the current domain
   - For localhost:3000 → localhost:8001, cookies won't be sent automatically
   - **Solution**: Use a proxy or ensure same domain

3. **Check HTTPS**:
   - In production, cookies require HTTPS
   - `secure: true` flag requires HTTPS connection

### Cross-Origin Cookie Issues

If frontend (localhost:3000) and backend (localhost:8001) are on different ports:

**Option 1: Use Next.js API proxy** (Recommended)
- Route FastAPI requests through Next.js API routes
- Cookies will work on same domain

**Option 2: Use same domain**
- Run both on same port using a reverse proxy
- Or use subdomains (api.example.com, app.example.com)

**Option 3: Fallback to Authorization header**
- FastAPI still supports Authorization header
- Can use both methods simultaneously

## Next Steps

- [x] Implement httpOnly cookies
- [x] Update API client
- [x] Update FastAPI authentication
- [ ] Test with all endpoints
- [ ] Update documentation
- [ ] Consider refresh token implementation

## Security Checklist

- [x] httpOnly cookies (XSS protection)
- [x] Secure flag in production (HTTPS only)
- [x] SameSite=Lax (CSRF protection)
- [x] Short expiration (30 minutes)
- [x] CORS with credentials enabled
- [ ] Rate limiting on token generation
- [ ] Token rotation/refresh tokens
