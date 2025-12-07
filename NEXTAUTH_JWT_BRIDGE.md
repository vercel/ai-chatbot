# NextAuth → JWT Bridge Implementation

## Effort Assessment

**Estimated Time: 1-2 hours**

**Complexity: Medium** - Straightforward but requires careful coordination

## What Needs to Be Done

### 1. Create JWT Bridge Endpoint (30 min)

Create a Next.js API route that converts NextAuth session to JWT:

**File: `app/api/auth/jwt-bridge/route.ts`**

```typescript
import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Generate JWT token matching FastAPI format
  const token = jwt.sign(
    {
      sub: session.user.id,
      type: session.user.type,
    },
    process.env.JWT_SECRET_KEY!, // Share secret with FastAPI
    {
      expiresIn: "30m", // Match FastAPI JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    }
  );

  return NextResponse.json({ access_token: token });
}
```

### 2. Update API Client (15 min)

Update `lib/api-client.ts` to fetch JWT from bridge:

```typescript
async function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if we have a cached token
  let token = localStorage.getItem('auth_token');

  // If no token or expired, get new one from bridge
  if (!token || isTokenExpired(token)) {
    try {
      const response = await fetch('/api/auth/jwt-bridge');
      if (response.ok) {
        const { access_token } = await response.json();
        localStorage.setItem('auth_token', access_token);
        token = access_token;
      }
    } catch (error) {
      console.error('Failed to get JWT token:', error);
      return null;
    }
  }

  return token;
}
```

### 3. Share JWT Secret (5 min)

Add to Next.js `.env.local`:
```env
JWT_SECRET_KEY=your-shared-secret-key
```

Same value in FastAPI `backend/.env`:
```env
JWT_SECRET_KEY=your-shared-secret-key
```

### 4. Handle Token Refresh (30 min)

Add token expiration checking and auto-refresh logic.

### 5. Testing (30 min)

- Test with authenticated user
- Test with guest user
- Test token expiration
- Test FastAPI endpoints

## Alternative: Simpler Approach (Even Less Effort)

### Option A: Skip Auth Temporarily (5 min)

Make vote endpoint work without auth for testing:

```python
# In vote.py
@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    # current_user: dict = Depends(get_current_user),  # Comment out
    db: AsyncSession = Depends(get_db)
):
    # Skip auth for now
    # TODO: Re-enable auth after bridge is implemented
```

### Option B: Use NextAuth Session Directly (More Complex)

Make FastAPI accept NextAuth session cookies - requires more backend changes.

## Recommendation

**For now**: Use **Option A** (skip auth temporarily) to test the vote endpoint migration.

**Later**: Implement the bridge when you're ready to migrate more endpoints that need auth.

## Why the Bridge is Medium Effort

✅ **Easy parts:**
- NextAuth session is already available
- JWT generation is straightforward
- API client already has token handling structure

⚠️ **Tricky parts:**
- Token expiration handling
- Ensuring tokens refresh automatically
- Coordinating JWT secret between Next.js and FastAPI
- Handling edge cases (session expired, etc.)

## Implementation Checklist

- [ ] Install `jsonwebtoken` in Next.js: `pnpm add jsonwebtoken @types/jsonwebtoken`
- [ ] Create `/api/auth/jwt-bridge` endpoint
- [ ] Share `JWT_SECRET_KEY` between Next.js and FastAPI
- [ ] Update `getAuthToken()` in API client
- [ ] Add token expiration checking
- [ ] Test with authenticated user
- [ ] Test with guest user
- [ ] Test token refresh

## Summary

**Effort: 1-2 hours** for a complete, production-ready bridge.

**Quick win: 5 minutes** to temporarily disable auth and test endpoints.

**Recommendation**: Start with quick win, implement bridge when needed.
