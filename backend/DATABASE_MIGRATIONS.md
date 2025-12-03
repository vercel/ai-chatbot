# Database Migrations Guide

This guide explains how to set up and use database migrations for your PostgreSQL database using Alembic.

## Overview

Alembic is a database migration tool for SQLAlchemy. It tracks schema changes and allows you to:

- Version control your database schema
- Apply changes incrementally
- Rollback changes if needed
- Keep multiple environments in sync

## Initial Setup

### 1. Install Dependencies

Alembic is already included in `requirements.txt` and `pyproject.toml`. If you need to install it:

```bash
# Using uv
uv pip install alembic

# Or using pip
pip install alembic
```

### 2. Configure Database URL

Ensure your `.env` file has the correct PostgreSQL connection string:

```env
POSTGRES_URL=postgresql+asyncpg://username:password@localhost:5432/database_name
```

**For your own PostgreSQL database**, update the connection string:

```env
POSTGRES_URL=postgresql+asyncpg://your_user:your_password@your_host:5432/your_database
```

Make sure the database is created and the user has the necessary permissions.

```bash
docker compose up -d db
docker exec -it db createdb -U postgres chatbot_db
docker exec -it db psql -U postgres -d chatbot_db
```

### 3. Initialize Alembic (Already Done)

The Alembic setup is already configured:

- `alembic.ini` - Main configuration file
- `alembic/env.py` - Environment setup for async SQLAlchemy
- `alembic/versions/` - Directory for migration files

## Creating Your First Migration

### Step 1: Review Your Models

All models are in `app/models/`:

- `user.py` - User model
- `chat.py` - Chat model
- `message.py` - Message model
- `vote.py` - Vote model
- `document.py` - Document model
- `stream.py` - Stream model
- `suggestion.py` - Suggestion model

### Step 2: Generate Initial Migration

If this is your first migration and you already have models:

```bash
cd backend
uv run alembic revision --autogenerate -m "Initial migration"
```

This will:

1. Compare your SQLAlchemy models with the current database state
2. Generate a migration file in `alembic/versions/`
3. Include all CREATE TABLE statements for your models

### Step 3: Review the Generated Migration

**Always review auto-generated migrations before applying!**

Open the generated file in `alembic/versions/` and check:

- Are all tables created correctly?
- Are foreign keys set up properly?
- Are indexes included?
- Are any custom constraints needed?

You can edit the migration file if needed.

### Step 4: Apply the Migration

```bash
uv run alembic upgrade head
```

This will:

1. Create the `alembic_version` table (if it doesn't exist)
2. Apply all pending migrations
3. Update your database schema

## Common Workflows

### Adding a New Field to a Model

1. **Edit the model** in `app/models/`:

   ```python
   class User(Base):
       # ... existing fields ...
       new_field = Column(String(100), nullable=True)
   ```

2. **Generate migration**:

   ```bash
   alembic revision --autogenerate -m "Add new_field to User"
   ```

3. **Review the migration** in `alembic/versions/`

4. **Apply migration**:
   ```bash
   uv run alembic upgrade head
   ```

### Creating a New Table

1. **Create the model** in `app/models/`:

   ```python
   class NewTable(Base):
       __tablename__ = "new_table"
       id = Column(UUID(as_uuid=True), primary_key=True)
       # ... other fields ...
   ```

2. **Import it** in `app/models/__init__.py`

3. **Generate migration**:

   ```bash
   alembic revision --autogenerate -m "Create new_table"
   ```

4. **Apply migration**:
   ```bash
   uv run alembic upgrade head
   ```

### Modifying an Existing Table

1. **Modify the model** in `app/models/`

2. **Generate migration**:

   ```bash
   alembic revision --autogenerate -m "Modify table_name"
   ```

3. **Review migration** - Alembic will detect:

   - Added columns
   - Removed columns
   - Changed column types
   - Added/removed indexes
   - Foreign key changes

4. **Apply migration**:
   ```bash
   uv run alembic upgrade head
   ```

## Migration Commands Reference

### Check Current Status

```bash
# Show current database revision
uv run alembic current

# Show migration history
uv run alembic history

# Show pending migrations
uv run alembic heads
```

### Apply Migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Apply up to a specific revision
uv run alembic upgrade <revision_id>

# Apply next migration only
uv run alembic upgrade +1
```

### Rollback Migrations

```bash
# Rollback one migration
uv run alembic downgrade -1

# Rollback to a specific revision
uv run alembic downgrade <revision_id>

# Rollback all migrations (⚠️ DANGEROUS)
uv run alembic downgrade base
```

### Manual Migrations

For complex changes that Alembic can't auto-detect:

```bash
# Create empty migration
uv run alembic revision -m "Manual migration description"
```

Then edit the generated file in `alembic/versions/` to add custom SQL:

```python
def upgrade() -> None:
    op.execute("""
        -- Your custom SQL here
        ALTER TABLE "User" ADD COLUMN custom_field TEXT;
    """)

def downgrade() -> None:
    op.execute("""
        ALTER TABLE "User" DROP COLUMN custom_field;
    """)
```

## Working with Your Own PostgreSQL Database

### 1. Update Connection String

Edit your `.env` file:

```env
POSTGRES_URL=postgresql+asyncpg://your_username:your_password@your_host:5432/your_database
```

### 2. Test Connection

```bash
# Using Python
python -c "from app.config import settings; print(settings.POSTGRES_URL)"
```

### 3. Create Initial Migration

If your database is empty:

```bash
uv run alembic revision --autogenerate -m "Initial schema"
uv run alembic upgrade head
```

### 4. Sync Existing Database

If your database already has tables:

1. **Check current state**:

   ```bash
   uv run alembic current
   ```

2. **If no migrations exist**, create initial migration:

   ```bash
   uv run alembic revision --autogenerate -m "Initial schema from existing database"
   ```

3. **Mark as applied** (if tables already exist):

   ```bash
   uv run alembic stamp head
   ```

   This tells Alembic that the current database state matches the latest migration without actually running it.

## Best Practices

1. **Always review auto-generated migrations** before applying
2. **Test migrations on development** before production
3. **Keep migrations small and focused** - one logical change per migration
4. **Never edit applied migrations** - create a new migration instead
5. **Use descriptive migration messages** - `-m "Add user email verification"`
6. **Backup your database** before applying migrations in production
7. **Use transactions** - migrations run in transactions by default (PostgreSQL)

## Troubleshooting

### "Target database is not up to date"

This means there are pending migrations. Apply them:

```bash
uv run alembic upgrade head
```

### "Can't locate revision identified by 'xxxxx'"

This usually means your migration history is out of sync. Check:

```bash
uv run alembic current
uv run alembic history
```

You may need to manually fix the `alembic_version` table or use `alembic stamp` to mark the current state.

### Migration conflicts

If multiple developers create migrations:

1. Pull latest changes
2. Check for conflicts in `alembic/versions/`
3. Resolve conflicts manually
4. Test the merged migration

### Database schema doesn't match models

If your database is out of sync:

1. Check what Alembic thinks: `alembic current`
2. Check what should be: `alembic heads`
3. Generate a migration to sync: `alembic revision --autogenerate -m "Sync schema"`
4. Review and apply: `alembic upgrade head`

## Example: Complete Workflow

```bash
# 1. Make changes to app/models/user.py
#    (e.g., add a new 'phone' field)

# 2. Generate migration
uv run alembic revision --autogenerate -m "Add phone field to User"

# 3. Review generated migration in alembic/versions/

# 4. Apply migration
uv run alembic upgrade head

# 5. Verify
uv run alembic current
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
