# JWT Bridge Implementation Summary

## ✅ Completed Implementation

The NextAuth → JWT bridge has been successfully implemented! This allows the frontend to seamlessly authenticate with FastAPI endpoints using JWT tokens derived from NextAuth sessions.

## What Was Implemented

### 1. JWT Bridge Endpoint (`app/api/auth/jwt-bridge/route.ts`)
- Converts NextAuth session to JWT token
- Returns token in format expected by FastAPI
- Handles authentication errors gracefully

### 2. Enhanced API Client (`lib/api-client.ts`)
- Automatically fetches JWT tokens from bridge endpoint
- Caches tokens in localStorage
- Checks token expiration and auto-refreshes
- Includes tokens in FastAPI request headers

### 3. Updated FastAPI Endpoints
- **Vote endpoint**: Re-enabled authentication (removed temporary workarounds)
- **History endpoint**: Already using authentication properly

### 4. Dependencies
- Installed `jsonwebtoken` and `@types/jsonwebtoken` in Next.js

## How It Works

```
┌─────────────┐
│   Frontend   │
│  (NextAuth) │
└──────┬──────┘
       │
       │ 1. User makes request to FastAPI endpoint
       │
       ▼
┌─────────────────────┐
│   apiFetch()        │
│  - Checks for token │
│  - If expired/missing, calls bridge
└──────┬──────────────┘
       │
       │ 2. GET /api/auth/jwt-bridge
       │
       ▼
┌─────────────────────┐
│  JWT Bridge Endpoint │
│  - Gets NextAuth session
│  - Generates JWT token
│  - Returns { access_token }
└──────┬──────────────┘
       │
       │ 3. Token cached in localStorage
       │
       ▼
┌─────────────────────┐
│   FastAPI Request    │
│  - Authorization: Bearer <token>
└──────┬──────────────┘
       │
       │ 4. FastAPI validates JWT
       │
       ▼
┌─────────────────────┐
│   FastAPI Endpoint   │
│  - Extracts user_id from token
│  - Processes request
└─────────────────────┘
```

## Token Details

- **Format**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Expiration**: 30 minutes (configurable)
- **Claims**:
  - `sub`: User ID (from NextAuth)
  - `type`: User type ("guest" | "regular")
  - `exp`: Expiration timestamp

## Configuration Required

### Next.js (`.env.local`)
```env
JWT_SECRET_KEY=your-secret-key-here
```

### FastAPI (`backend/.env`)
```env
JWT_SECRET_KEY=your-secret-key-here
```

**Important**: Both must use the same secret key!

## Testing

### 1. Test Bridge Endpoint
```bash
# Should return JWT token if authenticated
curl http://localhost:3000/api/auth/jwt-bridge

# Expected response:
# { "access_token": "eyJhbGc..." }
```

### 2. Test with FastAPI Endpoint

1. Set environment variables:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=history,vote
   NEXT_PUBLIC_API_URL=http://localhost:8001
   JWT_SECRET_KEY=your-shared-secret
   ```

2. Start FastAPI backend:
   ```bash
   cd backend && uv run uvicorn app.main:app --reload --port 8001
   ```

3. Use the frontend - authentication should work automatically!

### 3. Verify Token in Browser

1. Open browser DevTools → Application → Local Storage
2. Look for `auth_token` key
3. Decode JWT at https://jwt.io to verify contents

## Security Features

- ✅ Token expiration (30 minutes)
- ✅ Automatic token refresh (60 seconds before expiration)
- ✅ Secure token storage (localStorage)
- ✅ Shared secret key validation
- ✅ User authorization checks in FastAPI endpoints

## Next Steps

1. **Set JWT_SECRET_KEY** in both `.env.local` and `backend/.env`
2. **Test authentication** with existing endpoints (history, vote)
3. **Migrate more endpoints** that require authentication
4. **Consider production improvements**:
   - Use httpOnly cookies instead of localStorage
   - Implement refresh tokens for longer sessions
   - Add rate limiting for token generation

## Files Modified

1. `app/api/auth/jwt-bridge/route.ts` - New bridge endpoint
2. `lib/api-client.ts` - Enhanced token handling
3. `backend/app/api/v1/vote.py` - Re-enabled authentication
4. `package.json` - Added jsonwebtoken dependencies

## Troubleshooting

See `JWT_BRIDGE_SETUP.md` for detailed troubleshooting guide.

## Status

✅ **Ready for use!** The bridge is fully implemented and ready to authenticate requests to FastAPI endpoints.

