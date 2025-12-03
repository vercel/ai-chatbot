# Database Migrations with Alembic

This directory contains Alembic migration scripts for managing database schema changes.

## Setup

1. Ensure your `.env` file has the correct `POSTGRES_URL`:

   ```env
   POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/database_name
   ```

2. Alembic will automatically convert the async URL to a sync URL for migrations.

## Common Commands

### Create a New Migration

```bash
# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "Description of changes"

# Create empty migration (for manual changes)
uv run alembic revision -m "Description of changes"
```

### Apply Migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Apply migrations up to a specific revision
uv run alembic upgrade <revision>

# Apply next migration only
uv run alembic upgrade +1
```

### Rollback Migrations

```bash
# Rollback one migration
uv run alembic downgrade -1

# Rollback to a specific revision
uv run alembic downgrade <revision>

# Rollback all migrations
uv run alembic downgrade base
```

### Check Migration Status

```bash
# Show current revision
uv run alembic current

# Show migration history
uv run alembic history

# Show pending migrations
uv run alembic heads
```

## Workflow

1. **Make model changes** in `app/models/`
2. **Generate migration**: `uv run alembic revision --autogenerate -m "Add new field"`
3. **Review the generated migration** in `alembic/versions/`
4. **Apply migration**: `uv run alembic upgrade head`
5. **Test your changes**

## Important Notes

- Always review auto-generated migrations before applying them
- Test migrations on a development database first
- Keep migrations small and focused
- Never edit existing migrations that have been applied to production
- Use `alembic downgrade` carefully in production

## Troubleshooting

### Migration conflicts

If you have conflicts, you may need to:

1. Check current revision: `uv run alembic current`
2. Manually resolve conflicts in migration files
3. Mark revisions as resolved: `uv run alembic stamp <revision>`

### Database out of sync

If your database is out of sync:

1. Check current revision: `uv run alembic current`
2. Check expected revision: `uv run alembic heads`
3. Apply missing migrations: `uv run alembic upgrade head`
