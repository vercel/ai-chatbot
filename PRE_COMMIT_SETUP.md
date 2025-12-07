# Pre-commit Hooks Setup

This project uses [pre-commit](https://pre-commit.com/) to automatically run code quality checks before each commit.

## Installation

### Option 1: Using uv (Recommended for this project)

This project uses `uv` for Python dependency management. Pre-commit is already included in the backend dev dependencies.

1. **Sync dependencies and install git hooks**:

   ```bash
   # From project root
   cd backend
   uv sync
   uv run pre-commit install
   ```

   This will:
   - Install pre-commit in the uv environment
   - Install the hooks into your `.git/hooks/` directory
   - Configure hooks to use the uv environment for Python tools

2. **Verify installation**:

   ```bash
   # From project root
   cd backend
   uv run pre-commit --version
   ```

### Option 2: Global Installation

If you prefer to install pre-commit globally:

1. **Install pre-commit** (choose one method):

   ```bash
   # Using pip
   pip install pre-commit

   # Or using Homebrew (macOS)
   brew install pre-commit

   # Or using conda
   conda install -c conda-forge pre-commit
   ```

2. **Install the git hooks**:

   ```bash
   pre-commit install
   ```

   This will install the hooks into your `.git/hooks/` directory.

## What Gets Checked

The pre-commit hooks will automatically run:

### Frontend (TypeScript/JavaScript)
- **Biome/Ultracite**: Linting and formatting for `.ts`, `.tsx`, `.js`, `.jsx` files
- Uses your existing `biome.jsonc` configuration

### Backend (Python)
- **Ruff**: Fast Python linter with auto-fix
- **Ruff Format**: Python code formatter
- **Black**: Additional Python formatter (as backup)
- Only runs on files in the `backend/` directory

### General Checks
- Trailing whitespace removal
- End of file fixes
- YAML/JSON syntax validation
- Large file detection (>1MB)
- Merge conflict markers
- Private key detection

### Docker Security
- **Custom check**: Ensures Dockerfile doesn't run as root user
- Runs the `pre-commit-hooks/check-docker-root.sh` script

## Usage

### Automatic (Recommended)
Once installed, hooks run automatically on `git commit`. If any hook fails, the commit is blocked until issues are fixed.

### Manual Execution

**If using uv** (recommended):

```bash
# From project root
cd backend

# Run on all files
uv run pre-commit run --all-files

# Run on staged files only
uv run pre-commit run

# Run a specific hook
uv run pre-commit run biome-check
uv run pre-commit run ruff
```

**If using global installation**:

```bash
# Run on all files
pre-commit run --all-files

# Run on staged files only
pre-commit run

# Run a specific hook
pre-commit run biome-check
pre-commit run ruff
```

### Bypassing Hooks (Not Recommended)
If you need to bypass hooks in an emergency:

```bash
git commit --no-verify
```

⚠️ **Warning**: Only use this when absolutely necessary, as it skips all quality checks.

## Updating Hooks

**If using uv**:

```bash
cd backend
uv run pre-commit autoupdate
```

**If using global installation**:

```bash
pre-commit autoupdate
```

This will update the hook versions in `.pre-commit-config.yaml` to their latest versions.

## Troubleshooting

### Hooks not running
- Make sure you ran `pre-commit install`
- Check that `.git/hooks/pre-commit` exists and is executable

### Biome/Ultracite not found
- Make sure `pnpm install` has been run
- Verify `@biomejs/biome` is in `node_modules`

### Python tools not found
- **If using uv**: Make sure dependencies are synced:
  ```bash
  cd backend
  uv sync
  ```
- **If using global installation**: Make sure Python dependencies are installed:
  ```bash
  cd backend
  uv sync  # or pip install -r requirements.txt
  ```
- The hooks are configured to use `uv run` for Python tools, so they should automatically use the uv environment

### Docker check failing
- Ensure `pre-commit-hooks/check-docker-root.sh` is executable:
  ```bash
  chmod +x pre-commit-hooks/check-docker-root.sh
  ```

## Configuration

The configuration file is `.pre-commit-config.yaml` in the project root. You can customize:
- Which hooks to run
- File patterns to include/exclude
- Hook arguments and options

For more information, see the [pre-commit documentation](https://pre-commit.com/).
