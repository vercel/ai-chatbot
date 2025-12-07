#!/bin/bash
# Wrapper script to run uv commands from project root
# Usage: run-uv-command.sh <command> [args...] [files...]
# Example: pre-commit-hooks/run-uv-command.sh ruff check --fix backend/app/main.py

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT/backend" || exit 1

# Process all arguments: convert file paths from backend/... to relative paths
ARGS=()
for arg in "$@"; do
    # If it's a file path with backend/ prefix (relative or absolute), strip it
    if [[ "$arg" == backend/* ]]; then
        # Relative path: strip backend/ prefix
        ARGS+=("${arg#backend/}")
    elif [[ "$arg" == "$PROJECT_ROOT"/backend/* ]]; then
        # Absolute path: strip project root and backend prefix
        ARGS+=("${arg#$PROJECT_ROOT/backend/}")
    else
        # Regular argument (command, flag, etc.) - pass through
        ARGS+=("$arg")
    fi
done

# Run the command with processed arguments
uv run "${ARGS[@]}"
