# UV Project Setup

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

## Quick Start

### Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or with pip
pip install uv
```

### Setup Project

```bash
cd backend

# Install all dependencies (creates .venv automatically)
uv sync

# Or with dev dependencies
uv sync --dev
```

### Run Commands

```bash
# Run the FastAPI server
uv run uvicorn app.main:app --reload --port 8000

# Run tests
uv run pytest

# Run any Python script
uv run python script.py

# Or use the convenience script
./run.sh
```

## Common uv Commands

```bash
# Install dependencies
uv sync

# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Remove a dependency
uv remove package-name

# Update dependencies
uv sync --upgrade

# Show installed packages
uv pip list

# Run commands in the project environment
uv run <command>
```

## Virtual Environment

uv automatically creates and manages a virtual environment in `.venv/`. You can:

- **Use `uv run`** - Automatically uses the project's virtual environment
- **Activate manually** - `source .venv/bin/activate` (Linux/Mac) or `.venv\Scripts\activate` (Windows)

## Benefits of uv

- ⚡ **Fast** - 10-100x faster than pip
- 🔒 **Reliable** - Better dependency resolution
- 📦 **Modern** - Uses `pyproject.toml` standard
- 🎯 **Simple** - No need to manage venv manually

## Migration from pip/venv

If you were using `pip` and `venv`:

| Old (pip/venv) | New (uv) |
|----------------|----------|
| `python -m venv venv` | `uv sync` (automatic) |
| `source venv/bin/activate` | `uv run <command>` |
| `pip install -r requirements.txt` | `uv sync` |
| `pip install package` | `uv add package` |
| `pip freeze > requirements.txt` | `uv.lock` (automatic) |

## Project Structure

- `pyproject.toml` - Project configuration and dependencies
- `uv.lock` - Locked dependency versions (auto-generated)
- `.venv/` - Virtual environment (auto-created, gitignored)
