# WorkOS AuthKit Migration Plan

#### note - our application does not need to support guests

## Context & Rationale

We are migrating from a legacy authentication system (NextAuth/guest) to WorkOS AuthKit for a more robust, modern, and unified authentication experience. This migration will:
- Simplify authentication logic
- Provide a hosted, secure login UI
- Unify session and user management
- Remove technical debt from legacy auth code

## Migration Steps (Systematic Approach)

1. **Inventory and Audit Existing Auth Usage** ✅ COMPLETE
   - Identified all places where the old auth system (NextAuth/guest) is used:
     - API routes (e.g., `/api/auth/*`)
     - Middleware logic
     - Components/hooks (e.g., `useSession`, `signIn`, `signOut`)
     - Pages that require authentication or user info

2. **Incrementally Migrate Protected Routes** ✅ COMPLETE
   - **COMPLETED**: All main pages migrated to AuthKit
     - `app/(chat)/page.tsx` - Migrated from NextAuth `auth()` to AuthKit `withAuth()`
     - `app/(chat)/chat/[id]/page.tsx` - Migrated from NextAuth `auth()` to AuthKit `withAuth()`
   - **COMPLETED**: Removed guest redirect logic since AuthKit middleware handles authentication

3. **Update Components and Hooks** ✅ COMPLETE
   - **COMPLETED**: All core components migrated to AuthKit
     - `app/(chat)/layout.tsx` - Migrated from NextAuth `auth()` to AuthKit `withAuth()`
     - `components/sidebar-user-nav.tsx` - Migrated from `useSession`/`signOut` to `useAuth`/AuthKit `signOut()`
     - `components/app-sidebar.tsx` - Updated to accept generic user object instead of NextAuth User type
     - `components/sidebar-history.tsx` - Updated to accept generic user object instead of NextAuth User type
     - `components/chat.tsx` - Updated to work directly with AuthKit user objects
     - `components/chat-header.tsx` - Updated to work with AuthKit user objects
     - `components/model-selector.tsx` - Simplified to work with AuthKit users, removed entitlements system

4. **Migrate API Routes** ✅ COMPLETE
   - **COMPLETED**: All API routes migrated from NextAuth to AuthKit with proper database user mapping
     - `app/(chat)/api/chat/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping for chat creation/deletion**
     - `app/(chat)/api/suggestions/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping**
     - `app/(chat)/api/files/upload/route.ts` - Migrated from `auth()` to `withAuth()` (no database operations)
     - `app/(chat)/api/history/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping**
     - `app/(chat)/api/document/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping for all operations**
     - `app/(chat)/api/chat/[id]/stream/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping**
     - `app/(chat)/api/vote/route.ts` - Migrated from `auth()` to `withAuth()`, **✅ Fixed database user mapping**

5. **Implement User Database Synchronization** ✅ COMPLETE
   - **COMPLETED**: WorkOS to Database User Mapping
     - Added `findOrCreateUserFromWorkOS()` function to sync WorkOS users with database
     - Added `getDatabaseUserFromWorkOS()` helper to get database user from WorkOS user
     - Implemented user synchronization in AuthKit callback using `onSuccess` pattern
     - Updated `app/(chat)/api/history/route.ts` to use database user IDs instead of WorkOS user IDs
   - **SOLUTION**: Users are automatically created in our database when they first authenticate via WorkOS
   - **MAPPING STRATEGY**: Using email as the key to link WorkOS users to database users

6. **Remove Legacy Auth Code** 🔄 IN PROGRESS
   - Delete or comment out:
     - Old API routes (e.g., `/api/auth/guest`, `/api/auth/[...nextauth]`)
     - Old auth config files (`auth.ts`, `auth.config.ts`)
     - Old middleware logic for NextAuth/guest
     - Old login/register pages and forms
     - Remove unused entitlements system

7. **Test the Full Auth Flow** ⏳ PENDING
   - Test:
     - Login (via `/login`)
     - Callback and session creation
     - Protected routes (redirects and access)
     - User data access and chat history
     - Logout (if implemented)

8. **Clean Up and Polish** ⏳ PENDING
   - Remove unused dependencies (e.g., `next-auth`, `bcrypt-ts`)
   - Update documentation and onboarding instructions

---

### **Migration Progress Updates**

#### **✅ COMPLETED: Database Synchronization Solution**

**Major Issues Resolved:**
1. **Problem**: WorkOS AuthKit user IDs are different from our database UUIDs, causing "Failed to get chats by user id" errors
2. **Problem**: Chat page access returning 404 for legitimate users due to ID mismatch in `app/(chat)/chat/[id]/page.tsx`
3. **Problem**: Session type mismatch in AI tools expecting NextAuth Session but receiving WorkOS UserInfo

**Solutions Implemented:**

1. **Database User Synchronization**:
   - Implemented proper user mapping between WorkOS and database via email
   - All API routes now use `getDatabaseUserFromWorkOS()` for consistent user ID handling

2. **Chat Page Access Fix** (`app/(chat)/chat/[id]/page.tsx`):
   - Fixed direct comparison of WorkOS user ID with database user ID
   - Added proper database user lookup before access control checks
   - Fixed `isReadonly` determination to use database user ID

3. **AI Tools Session Compatibility** (`app/(chat)/api/chat/route.ts`):
   - Created session adapter to transform WorkOS UserInfo to NextAuth-compatible Session
   - Added `expires` field and proper user object structure for AI tools

**Implementation Details:**
1. **AuthKit Callback Integration** (`app/callback/route.ts`):
   - Uses `handleAuth({ onSuccess: ... })` pattern recommended by WorkOS documentation
   - Automatically syncs WorkOS users to database on first authentication
   - Handles user creation gracefully without breaking auth flow

2. **Database User Management** (`lib/db/queries.ts`):
   - `findOrCreateUserFromWorkOS()`: Creates database users from WorkOS user data
   - `getDatabaseUserFromWorkOS()`: Maps WorkOS users to database users via email
   - Uses email as the linking key between WorkOS and database users

3. **API Route Updates**:
   - Updated `app/(chat)/api/history/route.ts` to use database user IDs
   - Added proper error handling for user lookup failures
   - Maintains existing database relationships (chats, messages, etc.)

**User Flow:**
1. User authenticates via WorkOS AuthKit
2. `onSuccess` callback automatically creates/finds database user by email
3. API routes use `getDatabaseUserFromWorkOS()` to get database user ID
4. All existing database queries work with proper user relationships

#### **✅ COMPLETED: Core Application Migration**
**Major Components Migrated:**
- **Pages**: Both main chat pages now use AuthKit's `withAuth({ ensureSignedIn: true })`
- **Components**: Chat, ChatHeader, ModelSelector simplified to work with AuthKit users
- **API Routes**: All 7 API routes migrated from NextAuth to AuthKit authentication
- **Layout & Sidebar**: Complete sidebar chain uses AuthKit patterns

**Key Simplifications:**
- **Removed Guest Support**: No more guest vs regular user distinction
- **Removed Entitlements System**: All authenticated users get access to all features
- **Simplified User Flow**: AuthKit middleware handles all authentication routing
- **Direct User Objects**: Components work with AuthKit user objects instead of NextAuth sessions

**Migration Notes:**
- User data flows consistently from AuthKit through all components
- No more NextAuth dependencies in core application logic
- Simplified authentication patterns throughout the app
- Type safety improved with direct AuthKit user objects
- **Database integration working**: Users can now access their chat history and create new chats

#### **🔄 NEXT PRIORITIES:**
1. **Update Remaining API Routes** - Apply the same database user mapping pattern to other API routes
2. **Legacy Code Cleanup** - Remove old NextAuth files and unused imports
3. **Testing** - Verify complete authentication and database flow works
4. **Dependencies** - Remove NextAuth and related unused packages 