# AI Chatbot FastAPI Backend

FastAPI backend for the AI Chatbot application, replacing the Next.js API routes.

## Setup

### Prerequisites

- Python 3.10 or higher
- Install `uv` if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or with pip: pip install uv
```

### 1. Install Dependencies

```bash
# Sync dependencies (creates virtual environment automatically)
uv sync

# Or install dev dependencies too
uv sync --dev
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `POSTGRES_URL`: PostgreSQL connection string (asyncpg format)
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `XAI_API_KEY`: XAI API key for AI models
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### 3. Run the Server

```bash
# Option 1: Using uv run
uv run uvicorn app.main:app --reload --port 8000

# Option 2: Using the run script
./run.sh

# Option 3: Activate the virtual environment first
source .venv/bin/activate  # uv creates .venv by default
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── api/                 # API routes
│   │   ├── v1/              # API version 1
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── chat.py      # Chat endpoints
│   │   │   ├── history.py   # Chat history endpoints
│   │   │   ├── vote.py      # Voting endpoints
│   │   │   ├── document.py  # Document endpoints
│   │   │   └── files.py     # File upload endpoints
│   │   └── deps.py          # API dependencies (auth, DB)
│   ├── core/                # Core functionality
│   │   ├── database.py      # Database connection
│   │   ├── security.py      # JWT and password utilities
│   │   └── errors.py        # Error handling
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── db/                  # Database queries
│   └── ai/                  # AI/LLM integration
├── tests/                   # Tests
├── requirements.txt        # Python dependencies
└── .env.example           # Environment variables template
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/guest` - Create guest user

### Chat
- `POST /api/chat` - Create/continue chat (streaming)
- `DELETE /api/chat?id={id}` - Delete chat

### History
- `GET /api/history` - Get chat history
- `DELETE /api/history` - Delete all chats

### Vote
- `GET /api/vote?chatId={id}` - Get votes for chat
- `PATCH /api/vote` - Vote on message

### Document
- `GET /api/document?id={id}` - Get document
- `POST /api/document?id={id}` - Create/update document
- `DELETE /api/document?id={id}&timestamp={ts}` - Delete document

### Files
- `POST /api/files/upload` - Upload file to Blob storage

## Development

### Running Tests

```bash
# Using uv
uv run pytest

# Or activate venv first
source .venv/bin/activate
pytest
```

### Code Formatting

```bash
# Using uv
uv run black app/
uv run ruff check app/
uv run ruff format app/
```

### Database Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

## Migration Status

This is the initial setup. The following components need to be implemented:

- [ ] Database models (SQLAlchemy)
- [ ] Database queries (port from TypeScript)
- [ ] User authentication (complete implementation)
- [ ] Chat service with AI streaming
- [ ] All API endpoints (currently placeholders)
- [ ] AI/LLM integration
- [ ] Error handling improvements
- [ ] Rate limiting
- [ ] Testing

See [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) for detailed migration steps.

## Next Steps

1. Set up database models based on existing schema
2. Port database queries from `lib/db/queries.ts`
3. Implement authentication with user lookup
4. Implement chat streaming with AI provider
5. Test each endpoint thoroughly
6. Deploy to production
