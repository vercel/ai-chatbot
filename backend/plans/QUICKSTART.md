# Quick Start Guide

## 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 2. Install Dependencies

```bash
cd backend
uv sync
```

This will:
- Create a virtual environment (`.venv`)
- Install all dependencies
- Create a lock file (`uv.lock`)

## 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database URL and API keys
```

**Minimum required:**
```env
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

## 4. Run the Server

```bash
# Option 1: Using the script
./run.sh

# Option 2: Direct command
uv run uvicorn app.main:app --reload --port 8000
```

## 5. Verify It Works

Open in browser:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Common Commands

```bash
# Run tests
uv run pytest

# Add a dependency
uv add package-name

# Update dependencies
uv sync --upgrade

# Run any Python script
uv run python script.py
```

## Troubleshooting

**Python version error?**
- The project requires Python 3.10+
- If you have asdf: `asdf install python 3.10.6` then `asdf local python 3.10.6`

**Import errors?**
- Make sure you ran `uv sync`
- Use `uv run` prefix for commands

**Port already in use?**
- Change port: `uv run uvicorn app.main:app --reload --port 8001`
