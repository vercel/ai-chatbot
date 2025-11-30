# Sharing Database Between Next.js and FastAPI

This guide explains how to configure both Next.js and FastAPI backends to use the **same PostgreSQL database**.

## Overview

Both backends connect to the same PostgreSQL database, but use different connection string formats:

- **Next.js**: Uses `postgres-js` driver → `postgresql://...`
- **FastAPI**: Uses `asyncpg` driver → `postgresql+asyncpg://...`

## Configuration

### Step 1: Get Your Current Database Connection String

Check your Next.js `.env.local` file for the `POSTGRES_URL`:

```env
POSTGRES_URL=postgresql://user:password@localhost:5432/chatbot_db
```

### Step 2: Configure Next.js (Root Directory)

In `.env.local` at the project root:

```env
# Database connection (for Next.js/Drizzle)
POSTGRES_URL=postgresql://user:password@localhost:5432/chatbot_db
```

**Format**: `postgresql://user:password@host:port/database`

### Step 3: Configure FastAPI (Backend Directory)

In `backend/.env`:

```env
# Database connection (for FastAPI/SQLAlchemy with asyncpg)
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db
```

**Format**: `postgresql+asyncpg://user:password@host:port/database`

**Key Difference**: Add `+asyncpg` after `postgresql` for FastAPI.

## Connection String Conversion

If you have a Next.js connection string, convert it to FastAPI format:

### Example Conversion

**Next.js format:**
```
postgresql://myuser:mypassword@localhost:5432/chatbot_db
```

**FastAPI format:**
```
postgresql+asyncpg://myuser:mypassword@localhost:5432/chatbot_db
```

Just add `+asyncpg` after `postgresql`.

## Complete Environment Setup

### Project Root `.env.local` (Next.js)

```env
# Database (for Next.js API routes)
POSTGRES_URL=postgresql://user:password@localhost:5432/chatbot_db

# FastAPI Backend URL (for frontend routing)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_ENDPOINTS=vote

# Other Next.js config...
AUTH_SECRET=your-auth-secret
# ... etc
```

### Backend `backend/.env` (FastAPI)

```env
# Database (for FastAPI - note the +asyncpg)
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (allow Next.js frontend)
CORS_ORIGINS=http://localhost:3000

# AI/LLM
XAI_API_KEY=your-xai-api-key

# Blob Storage
BLOB_READ_WRITE_TOKEN=your-blob-token

# Environment
ENVIRONMENT=development
```

## Important Notes

### 1. Same Database, Different Drivers

Both backends access the **same tables** in the same database:
- `User`
- `Chat`
- `Message_v2`
- `Vote_v2`
- `Document`
- etc.

### 2. Schema Compatibility

The SQLAlchemy models in FastAPI should match your existing Drizzle schema:
- Table names must match exactly
- Column names must match
- Data types should be compatible

### 3. No Migrations Needed (Initially)

Since the database already exists with your Next.js schema:
- **Don't run Alembic migrations yet** (unless you want to manage schema with Alembic)
- SQLAlchemy models are just for querying existing tables
- Both backends read/write to the same tables

### 4. Concurrent Access

PostgreSQL handles concurrent connections well:
- Both backends can read/write simultaneously
- Transactions are isolated
- No special locking needed

## Verification

### Test Next.js Connection

```bash
# In project root
pnpm dev
# Check that Next.js API routes work
```

### Test FastAPI Connection

```bash
# In backend directory
cd backend
uv run uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000/docs
# Try the health endpoint
```

### Test Database Access

1. **Create a vote via Next.js** (if vote endpoint not migrated yet)
2. **Read it via FastAPI** - should see the same data
3. **Create a vote via FastAPI**
4. **Read it via Next.js** - should see the same data

## Troubleshooting

### Connection Refused

**Error**: `could not connect to server`

**Solution**:
- Ensure PostgreSQL is running: `pg_isready` or `psql -U user -d database`
- Check host/port in connection string
- Verify firewall settings

### Authentication Failed

**Error**: `password authentication failed`

**Solution**:
- Verify username/password in connection string
- Check PostgreSQL `pg_hba.conf` if using local connections
- Ensure user has access to the database

### Table Not Found

**Error**: `relation "Chat" does not exist`

**Solution**:
- Verify database name is correct
- Check that tables exist: `\dt` in `psql`
- Ensure you're connecting to the right database (not a different one)

### Driver Mismatch

**Error**: `no driver specified` or connection string format issues

**Solution**:
- Next.js: Use `postgresql://` (no `+asyncpg`)
- FastAPI: Use `postgresql+asyncpg://` (with `+asyncpg`)

### Port Conflicts

**Error**: `address already in use`

**Solution**:
- Next.js default: port 3000
- FastAPI default: port 8000
- Change ports if needed in respective configs

## Example: Full Setup

### 1. Database Connection String

From your hosting provider or local setup:
```
postgresql://myuser:mypass@db.example.com:5432/chatbot_prod
```

### 2. Next.js `.env.local`

```env
POSTGRES_URL=postgresql://myuser:mypass@db.example.com:5432/chatbot_prod
```

### 3. FastAPI `backend/.env`

```env
POSTGRES_URL=postgresql+asyncpg://myuser:mypass@db.example.com:5432/chatbot_prod
```

### 4. Both Connect to Same Database ✅

Both backends now read/write to the same `chatbot_prod` database.

## Migration Strategy

During migration, you can:

1. **Start with one endpoint** (e.g., vote)
2. **Test thoroughly** - ensure data consistency
3. **Gradually migrate more endpoints**
4. **Both backends work in parallel** during transition
5. **Eventually deprecate Next.js routes** once all migrated

## Security Considerations

1. **Never commit `.env` files** - use `.env.example` templates
2. **Use different credentials** for dev/staging/prod
3. **Limit database user permissions** - only what's needed
4. **Use connection pooling** - both drivers support it
5. **Monitor connections** - ensure no connection leaks

## Next Steps

Once both backends are connected to the same database:

1. ✅ Test vote endpoint migration
2. ✅ Verify data consistency
3. ✅ Migrate more endpoints incrementally
4. ✅ Monitor for any issues
5. ✅ Eventually remove Next.js API routes

---

**Summary**: Use the same database connection details, but add `+asyncpg` to the FastAPI connection string. Both backends will share the same database seamlessly!

