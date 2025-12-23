# TiQology Database Migrations

Complete SQL migration suite for TiQology infrastructure optimizations.

## Migration Files

1. **001_tiqology_optimizations.sql** - Main migration (19 indexes + 15 RLS policies)
2. **002_verify_optimizations.sql** - Verification queries
3. **003_auto_maintenance.sql** - Auto-vacuum configuration

## Execution Methods

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `001_tiqology_optimizations.sql`
4. Click **Run** to execute
5. Run `002_verify_optimizations.sql` to confirm
6. Run `003_auto_maintenance.sql` for optimization

### Option 2: psql Command Line

```bash
# Set your Supabase connection string (use service_role URL for DDL)
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
psql "$DATABASE_URL" -f db/migrations/001_tiqology_optimizations.sql
psql "$DATABASE_URL" -f db/migrations/002_verify_optimizations.sql
psql "$DATABASE_URL" -f db/migrations/003_auto_maintenance.sql
```

### Option 3: Supabase CLI

```bash
# Set remote connection (if needed)
supabase db remote set "$SUPABASE_DB_URL"

# Execute migrations
supabase db execute --file db/migrations/001_tiqology_optimizations.sql
supabase db execute --file db/migrations/002_verify_optimizations.sql
supabase db execute --file db/migrations/003_auto_maintenance.sql
```

### Option 4: Automated Script

```bash
# Make executable (if not already)
chmod +x db/execute-optimizations.sh

# Run with DATABASE_URL set
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
./db/execute-optimizations.sh
```

**Important:** Use a server-side connection (service_role or DB direct URL) to run DDL commands. Do NOT run from client-side contexts.

## What Gets Applied

### Indexes (19 total)
- **users**: 3 indexes (email UNIQUE, created_at, updated_at)
- **chats**: 4 indexes (user_id, created_at, visibility, composite)
- **messages**: 4 indexes (chat_id, created_at, role, composite)
- **documents**: 3 indexes (user_id, created_at, kind)
- **votes**: 2 indexes (chat_id, message_id)
- **suggestions**: 3 indexes (document_id, user_id, created_at)

### RLS Policies (15 total)
- **users**: 2 policies (SELECT/UPDATE own)
- **chats**: 4 policies (SELECT own/public, INSERT/UPDATE/DELETE own)
- **messages**: 2 policies (SELECT chat access, INSERT chat owner)
- **documents**: 4 policies (SELECT/INSERT/UPDATE/DELETE own)
- **votes**: 2 policies (SELECT all, INSERT chat access)
- **suggestions**: 2 policies (SELECT/INSERT document access)

### Auto-Maintenance
- Per-table autovacuum tuning (0.01-0.02 scale factor)
- Aggressive analyze thresholds (50-100 rows)
- Immediate VACUUM ANALYZE on all tables

## Verification

Expected results after running `002_verify_optimizations.sql`:
- **19 rows** from index query
- **6 rows** from RLS enabled query (all `true`)
- **15 rows** from policies query

## Connection Pool Settings

Configure in Supabase Dashboard → Settings → Database:

- **Pool Mode**: Transaction
- **Min Connections**: 2
- **Max Connections**: 10
- **Idle Timeout**: 30s
- **Max Client Connections**: 1000

## Rollback (if needed)

To revert changes:

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_users_email CASCADE;
-- ... (repeat for all 19 indexes)

-- Drop policies
DROP POLICY IF EXISTS users_select_own ON public.users;
-- ... (repeat for all 15 policies)

-- Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all 6 tables)
```

## Performance Impact

- **Expected**: 2-10x query speedup on filtered operations
- **Index creation**: 1-5 minutes (depends on table size)
- **RLS overhead**: ~5-15% query time increase (balanced by security)
- **Autovacuum**: Continuous background maintenance

## Next Steps

1. ✅ Run migration 001
2. ✅ Verify with 002
3. ✅ Configure maintenance with 003
4. ✅ Update connection pool settings in dashboard
5. ⚙️ Monitor query performance with EXPLAIN ANALYZE
6. ⚙️ Adjust autovacuum thresholds based on load
