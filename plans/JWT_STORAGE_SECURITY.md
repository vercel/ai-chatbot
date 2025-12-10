# JWT Token Storage Security Guide

## Current Implementation: localStorage

**Status**: ⚠️ **Acceptable for development, but has security risks for production**

### Security Risks

1. **XSS (Cross-Site Scripting) Vulnerability**
   - Any malicious JavaScript on the page can access localStorage
   - If your site has an XSS vulnerability, tokens can be stolen
   - Example: A compromised third-party script or injected code

2. **Accessible to All JavaScript**
   - Browser extensions can read localStorage
   - Any script running on your domain has access
   - No built-in protection against token theft

3. **Persistence**
   - Tokens persist even after browser is closed
   - No automatic cleanup on logout (unless explicitly handled)
   - Can be accessed across tabs/windows

### Current Mitigations

✅ **Short expiration** (30 minutes) - Limits damage if token is stolen
✅ **Auto-refresh** - Tokens are refreshed before expiration
✅ **HTTPS required** - Tokens are only sent over encrypted connections
✅ **Same-origin policy** - localStorage is domain-specific

## Recommended Solutions

### Option 1: httpOnly Cookies (Best for Production) ⭐

**Pros:**
- ✅ Not accessible to JavaScript (XSS protection)
- ✅ Automatically sent with requests
- ✅ Can be set with `Secure` and `SameSite` flags
- ✅ Server can control expiration

**Cons:**
- ⚠️ Requires CSRF protection
- ⚠️ More complex implementation
- ⚠️ Need to handle cookie-based auth in FastAPI

**Implementation:**

```typescript
// In jwt-bridge endpoint - set cookie instead of returning JSON
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = jwt.sign(
    { sub: session.user.id, type: session.user.type },
    process.env.JWT_SECRET_KEY!,
    { expiresIn: "30m", algorithm: "HS256" }
  );

  const response = NextResponse.json({ success: true });

  // Set httpOnly cookie
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  return response;
}
```

```typescript
// In api-client.ts - read from cookie (server-side) or fetch with credentials
async function getAuthToken(): Promise<string | null> {
  // For server-side, cookies are automatically included
  // For client-side, fetch with credentials: 'include'
  // FastAPI will read from Cookie header instead of Authorization header
}
```

### Option 2: In-Memory Storage (Most Secure, Less Convenient)

**Pros:**
- ✅ Not persisted anywhere
- ✅ Cleared on page refresh
- ✅ Not accessible to extensions

**Cons:**
- ❌ Lost on page refresh (user must re-authenticate)
- ❌ Not shared across tabs
- ❌ More API calls needed

**Implementation:**

```typescript
// Store in module-level variable (not exported)
let tokenCache: { token: string; expires: number } | null = null;

async function getAuthToken(): Promise<string | null> {
  // Check in-memory cache
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  // Fetch new token
  const token = await fetchJWTToken();
  if (token) {
    const payload = decodeJWT(token);
    tokenCache = {
      token,
      expires: payload.exp * 1000 - 60_000, // 60s buffer
    };
  }
  return token;
}
```

### Option 3: Hybrid Approach (Recommended for Migration)

**Current**: localStorage (development)
**Future**: httpOnly cookies (production)

```typescript
const USE_HTTPONLY_COOKIES = process.env.NEXT_PUBLIC_USE_HTTPONLY_COOKIES === "true";

async function getAuthToken(): Promise<string | null> {
  if (USE_HTTPONLY_COOKIES) {
    // For httpOnly cookies, token is automatically sent
    // FastAPI reads from Cookie header
    return "cookie"; // Signal to use cookie auth
  } else {
    // Fallback to localStorage for development
    return localStorage.getItem("auth_token");
  }
}
```

## Security Best Practices

### For Development (Current Setup)

✅ **Acceptable** if:
- Running on localhost
- Using HTTPS in development
- Short token expiration (30 min)
- No sensitive production data

### For Production

🔒 **Must implement**:
1. **httpOnly cookies** instead of localStorage
2. **CSRF protection** (SameSite cookies help)
3. **Content Security Policy (CSP)** to prevent XSS
4. **HTTPS only** (no HTTP)
5. **Secure cookie flags** (`Secure`, `SameSite`)
6. **Token rotation** (refresh tokens)

## Migration Path

### Phase 1: Current (Development)
- ✅ localStorage with short expiration
- ✅ Auto-refresh logic
- ✅ HTTPS required

### Phase 2: Production Ready
- 🔄 Switch to httpOnly cookies
- 🔄 Add CSRF protection
- 🔄 Update FastAPI to read from cookies
- 🔄 Add CSP headers

### Phase 3: Enhanced Security
- 🔄 Implement refresh tokens
- 🔄 Add token rotation
- 🔄 Rate limiting on token generation

## Quick Security Checklist

- [ ] Use HTTPS in production
- [ ] Set short token expiration (30 min or less)
- [ ] Implement CSP headers
- [ ] Use httpOnly cookies for production
- [ ] Add CSRF protection
- [ ] Validate tokens on every request
- [ ] Implement rate limiting
- [ ] Log security events
- [ ] Regular security audits

## Recommendation

**For now (Development)**: localStorage is acceptable with:
- Short expiration (30 min) ✅
- Auto-refresh ✅
- HTTPS ✅

**For production**: Migrate to httpOnly cookies before going live.

Would you like me to implement the httpOnly cookie approach?
