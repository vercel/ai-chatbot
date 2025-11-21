# Database Architecture: Main DB vs Resource Store

## Overview

This document explains the difference between the **Main Database** and **Resource Store** in hosted mode, and identifies which tables belong where.

## Main Database (`POSTGRES_URL`)

**Purpose**: Stores system/configuration data that is shared across all tenants and managed by the platform.

**Location**: Always `process.env.POSTGRES_URL` (Supabase in production)

**Contains**:
- **System Tables** (platform-managed):
  - `users` - User profiles and authentication data
  - `workspaces` - Workspace definitions
  - `workspace_users` - Workspace membership and roles
  - `workspace_invites` - Invitation tokens
  - `workspace_apps` - Tenant database connection configurations
  - `roles` - Role definitions per workspace
  - `teams` - Team definitions per workspace

**When to Use**:
- Querying/updating user profiles (`user` table)
- Querying/updating workspace settings (`workspace` table)
- Managing workspace memberships (`workspace_users` table)
- Managing workspace connections (`workspace_apps` table)
- Any operation that needs to work before a tenant has configured their database

**How to Access**:
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const sql = postgres(process.env.POSTGRES_URL!);
const db = drizzle(sql);
try {
  // Query system tables
  const [user] = await db.select().from(user).where(eq(user.id, userId));
} finally {
  await sql.end({ timeout: 5 });
}
```

## Resource Store (Tenant Database)

**Purpose**: Stores tenant-specific application data that each tenant manages independently.

**Location**: Configured per workspace via `workspace_apps` table (points to tenant's own database)

**Contains**:
- **Application Tables** (tenant-managed):
  - `chats` - AI chat conversations
  - `messages` - Chat messages
  - `documents` - User documents
  - `suggestions` - Document suggestions
  - `votes` - Message votes
  - `streams` - Stream data
  - `tables` - Dynamic table definitions
  - `pages` - Page configurations
  - Any custom tables created by the tenant

**When to Use**:
- Querying tenant application data (chats, messages, documents, etc.)
- Creating/updating tenant-specific records
- Any operation that should be isolated per tenant

**How to Access**:
```typescript
import { resolveTenantContext } from "@/lib/server/tenant/context";
import { getResourceStore } from "@/lib/server/tenant/resource-store";

const tenant = await resolveTenantContext();
const store = await getResourceStore(tenant);
try {
  await store.withSqlClient(async (db) => {
    // Query tenant application tables
    const chats = await db.select().from(chat).where(eq(chat.user_id, userId));
  });
} finally {
  await store.dispose();
}
```

## Mode Differences

### Local Mode (`APP_MODE=local`)
- **Main DB = Resource Store**: Both system and application data are in the same database (`POSTGRES_URL`)
- All tables are accessible via `getResourceStore()`
- System tables can be queried through resource store

### Hosted Mode (`APP_MODE=hosted`)
- **Main DB**: System/configuration data only (`POSTGRES_URL`)
- **Resource Store**: Tenant application data (configured per workspace via `workspace_apps`)
- System tables (`user`, `workspace`, etc.) **MUST** be queried from main DB directly
- Application tables **MUST** be queried via resource store

## Table Classification

### System Tables (Main DB in hosted mode)
- `users`
- `workspaces`
- `workspace_users`
- `workspace_invites`
- `workspace_apps`
- `roles`
- `teams`

### Application Tables (Resource Store in hosted mode)
- `chats`
- `messages`
- `documents`
- `suggestions`
- `votes`
- `streams`
- `tables`
- `pages`

## Problematic Patterns to Avoid

### ❌ Wrong: Querying system tables via resource store in hosted mode
```typescript
// This will fail if tenant hasn't configured their database connection
const store = await getResourceStore(tenant);
await store.withSqlClient(async (db) => {
  const [user] = await db.select().from(user).where(eq(user.id, userId));
  // ❌ In hosted mode, 'user' table doesn't exist in tenant database!
});
```

### ✅ Correct: Query system tables from main DB in hosted mode
```typescript
const mode = getAppMode();
if (mode === "hosted") {
  const sql = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(sql);
  try {
    const [user] = await db.select().from(user).where(eq(user.id, userId));
  } finally {
    await sql.end({ timeout: 5 });
  }
} else {
  // Local mode: use resource store
  const store = await getResourceStore(tenant);
  // ...
}
```

## Files That Need Mode-Aware Queries

These files query system tables and need to check the mode:

1. ✅ `app/otp/actions.ts` - Fixed
2. ✅ `app/onboarding/actions.ts` - Fixed
3. ✅ `app/onboarding/page.tsx` - Fixed
4. ✅ `proxy.ts` - Fixed
5. ✅ `app/(app)/page.tsx` - Fixed
6. ⚠️ `lib/db/queries.ts` - `getUser()`, `createUser()`, `createGuestUser()` - Used by legacy auth only

## Notes

- The legacy auth functions (`getUser`, `createUser`, `createGuestUser`) in `lib/db/queries.ts` use `withTenantDb`, which queries from the tenant database. These are only used by the NextAuth system (`app/(legacy-auth)/`), not the Supabase auth system. They would fail in hosted mode if someone tried to use legacy auth, but since you're using Supabase auth, this is not a critical issue.

