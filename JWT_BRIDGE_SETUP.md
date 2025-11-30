# JWT Bridge Setup Guide

## Overview

The JWT bridge connects NextAuth sessions to FastAPI JWT authentication. When the frontend makes requests to FastAPI endpoints, it automatically fetches a JWT token from the bridge endpoint and includes it in the Authorization header.

## How It Works

1. **Frontend** makes a request to a FastAPI endpoint via `apiFetch()`
2. **API Client** checks if a valid JWT token exists in localStorage
3. If missing or expired, **API Client** calls `/api/auth/jwt-bridge`
4. **Bridge Endpoint** gets the NextAuth session and generates a JWT token
5. **JWT Token** is cached in localStorage and included in FastAPI requests
6. **FastAPI** validates the JWT token and extracts user information

## Setup Steps

### 1. Set JWT Secret Key

The same `JWT_SECRET_KEY` must be configured in both Next.js and FastAPI environments.

#### For Next.js (`.env.local`):

```env
JWT_SECRET_KEY=your-secret-key-here
```

#### For FastAPI (`backend/.env`):

```env
JWT_SECRET_KEY=your-secret-key-here
```

**Important**: Use the same value in both files!

#### Generate a Secure Secret (Production):

```bash
openssl rand -hex 32
```

### 2. Verify Configuration

#### Next.js
- Check that `JWT_SECRET_KEY` is set in `.env.local`
- The bridge endpoint will return a 500 error if not set

#### FastAPI
- Check that `JWT_SECRET_KEY` is set in `backend/.env`
- Default value is `"dev-secret-key-change-in-production"` (for development only)

### 3. Test the Bridge

#### Test Bridge Endpoint Directly:

```bash
# Should return JWT token if authenticated
curl http://localhost:3000/api/auth/jwt-bridge

# Should return 401 if not authenticated
```

#### Test with FastAPI Endpoint:

1. Make sure you're logged in (NextAuth session exists)
2. Configure FastAPI endpoint:
   ```env
   NEXT_PUBLIC_FASTAPI_ENDPOINTS=history
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```
3. Make a request - the JWT token should be automatically included

## Token Details

### Token Format

The JWT token contains:
- `sub`: User ID (from NextAuth session)
- `type`: User type ("guest" | "regular")
- `exp`: Expiration timestamp

### Token Expiration

- **Default**: 30 minutes (matches FastAPI `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Refresh Buffer**: Tokens are refreshed 60 seconds before expiration
- **Storage**: Cached in `localStorage` as `auth_token`

## Troubleshooting

### "Not authenticated" Error

- Make sure you're logged in via NextAuth
- Check that NextAuth session is valid
- Verify `/api/auth/jwt-bridge` returns a token

### "Server configuration error" (500)

- Check that `JWT_SECRET_KEY` is set in `.env.local`
- Restart Next.js dev server after adding the variable

### "Invalid authentication credentials" from FastAPI

- Verify `JWT_SECRET_KEY` matches between Next.js and FastAPI
- Check that the token hasn't expired
- Ensure FastAPI is using the same secret key

### Token Not Being Sent

- Check browser console for errors
- Verify `shouldUseFastAPI()` returns `true` for the endpoint
- Check that `getAuthToken()` is being called (add console.log if needed)

## Implementation Details

### Files Modified

1. **`app/api/auth/jwt-bridge/route.ts`**
   - Bridge endpoint that converts NextAuth session to JWT

2. **`lib/api-client.ts`**
   - Updated `getAuthToken()` to fetch from bridge
   - Added token expiration checking
   - Automatic token refresh

### Dependencies Added

- `jsonwebtoken` - JWT token generation
- `@types/jsonwebtoken` - TypeScript types

## Next Steps

After setting up the bridge:

1. ✅ Test authentication with existing endpoints (history, vote)
2. ✅ Re-enable authentication in FastAPI endpoints (remove `user_id` query params)
3. ✅ Migrate more endpoints that require authentication
4. ✅ Add error handling for token refresh failures

## Security Notes

- **Development**: Using a simple secret key is acceptable
- **Production**: Must use a strong, randomly generated secret key
- **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
- **Token Expiration**: 30 minutes default (adjust based on security requirements)

