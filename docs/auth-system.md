# Authentication System Documentation

## Overview

The authentication system in `app/(auth)/auth.ts` implements a NextAuth.js-based authentication with support for both regular user credentials and guest user access. The system uses bcrypt for password hashing and includes timing attack protection.

## File Structure

- **Main file**: `app/(auth)/auth.ts`
- **Configuration**: `app/(auth)/auth.config.ts`
- **Database queries**: `lib/db/queries.ts`
- **Constants**: `lib/constants.ts`

## Key Components

### 1. User Types

```typescript
export type UserType = 'guest' | 'regular';
```

The system supports two user types:
- **guest**: Temporary users created without credentials
- **regular**: Authenticated users with email/password

### 2. NextAuth Configuration

The system extends NextAuth's default types to include:
- User ID and type in sessions
- Custom JWT token with user type information

### 3. Authentication Providers

#### Regular User Authentication (`auth.ts:41-64`)
- Uses email/password credentials
- Queries database for existing users via `getUser()`
- Implements timing attack protection using `DUMMY_PASSWORD`
- Validates password with bcrypt comparison
- Returns user object with `type: 'regular'`

#### Guest User Authentication (`auth.ts:65-72`)
- Creates temporary guest users via `createGuestUser()`
- No credentials required
- Returns user object with `type: 'guest'`

### 4. Security Features

- **Timing Attack Protection**: Uses dummy password comparison when user doesn't exist
- **Password Hashing**: bcrypt for secure password storage
- **Guest User Isolation**: Separate authentication flow for guest users

## Database Integration

### User Management Functions

- `getUser(email)`: Retrieves user by email
- `createGuestUser()`: Creates temporary guest user with generated credentials
- Users stored with hashed passwords in PostgreSQL via Drizzle ORM

## Configuration

### Auth Config (`auth.config.ts`)
- Sign-in page: `/login`
- New user redirect: `/`
- Separated from main auth file for compatibility with non-Node.js environments

### Constants (`constants.ts`)
- `DUMMY_PASSWORD`: Generated dummy password for timing attack protection
- Environment detection utilities

## Refactoring Guidelines

### 1. Security Improvements

```typescript
// Consider adding rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Add password strength validation
const validatePasswordStrength = (password: string) => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};
```

### 2. Error Handling Enhancement

```typescript
// Add more specific error types
type AuthError = 'invalid_credentials' | 'user_not_found' | 'account_locked';

// Implement structured error responses
const handleAuthError = (error: AuthError) => {
  switch (error) {
    case 'invalid_credentials':
      return { error: 'Invalid email or password' };
    case 'user_not_found':
      return { error: 'Account not found' };
    case 'account_locked':
      return { error: 'Account temporarily locked' };
  }
};
```

### 3. Code Organization

```typescript
// Extract authentication logic into separate services
class AuthService {
  async validateCredentials(email: string, password: string) {
    // Move validation logic here
  }
  
  async createGuestSession() {
    // Move guest creation logic here
  }
}

// Use dependency injection for better testability
const authService = new AuthService(dbService, cryptoService);
```

### 4. Type Safety Improvements

```typescript
// Add stricter typing for user objects
interface AuthenticatedUser {
  id: string;
  email: string;
  type: UserType;
  createdAt: Date;
}

// Use branded types for better type safety
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };
```

### 5. Session Management

```typescript
// Add session timeout and refresh logic
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours

// Implement automatic session cleanup for guest users
const cleanupGuestSessions = async () => {
  const expiredSessions = await getExpiredGuestSessions();
  await Promise.all(expiredSessions.map(deleteGuestUser));
};
```

### 6. Testing Considerations

```typescript
// Add interfaces for better mocking
interface DatabaseAdapter {
  getUser(email: string): Promise<User[]>;
  createGuestUser(): Promise<User[]>;
}

// Separate configuration from implementation
const createAuthConfig = (deps: { db: DatabaseAdapter; crypto: CryptoService }) => {
  // Return NextAuth configuration
};
```

## Best Practices

1. **Always validate input**: Sanitize email addresses and validate password formats
2. **Use environment variables**: Store sensitive configuration in environment variables
3. **Monitor authentication attempts**: Log failed login attempts for security monitoring
4. **Regular security audits**: Review authentication flow for potential vulnerabilities
5. **Guest user cleanup**: Implement regular cleanup of expired guest users
6. **HTTPS only**: Ensure authentication only works over HTTPS in production

## Potential Issues to Address

1. **Guest user proliferation**: No cleanup mechanism for old guest users
2. **Password requirements**: No password strength validation
3. **Rate limiting**: No protection against brute force attacks
4. **Account lockout**: No mechanism to lock accounts after failed attempts
5. **Session duration**: No automatic session expiration for security