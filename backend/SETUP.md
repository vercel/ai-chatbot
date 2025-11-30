# FastAPI Backend Setup Guide

## Quick Start

### Prerequisites

Install `uv`:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 1. Install Dependencies

```bash
cd backend
uv sync
```

This will:
- Create a virtual environment automatically (`.venv`)
- Install all dependencies from `pyproject.toml`
- Create a lock file (`uv.lock`)
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

**Minimum required for testing:**
```env
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db
JWT_SECRET_KEY=test-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
```

### 4. Run the Server

```bash
# Option 1: Using the script
./run.sh

# Option 2: Using uv run (recommended)
uv run uvicorn app.main:app --reload --port 8000

# Option 3: Activate venv first
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 5. Verify Installation

Open your browser:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing the API

### Health Check
```bash
curl http://localhost:8000/health
```

### Get API Documentation
```bash
# Open in browser
open http://localhost:8000/docs
```

### Test Authentication (Placeholder)
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Guest user
curl -X POST http://localhost:8000/api/auth/guest
```

## Next Steps

1. **Set up database models** - Port SQLAlchemy models from existing schema
2. **Implement database queries** - Port queries from `lib/db/queries.ts`
3. **Complete authentication** - Add user lookup and creation
4. **Implement chat streaming** - Add AI provider integration
5. **Test endpoints** - Verify each endpoint works correctly

See [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) for detailed migration steps.

## Troubleshooting

### Import Errors
- Make sure you're in the `backend` directory
- Run `uv sync` to install dependencies
- If using `uv run`, it handles the virtual environment automatically

### Database Connection Errors
- Verify PostgreSQL is running
- Check `POSTGRES_URL` in `.env`
- Ensure database exists

### Port Already in Use
- Change port: `uvicorn app.main:app --reload --port 8001`
- Or kill existing process on port 8000

