#!/bin/bash
# Quick start script for FastAPI backend using uv

# Check if we're in development or production mode
# For production, use multiple workers for better performance
if [ "${ENVIRONMENT:-development}" = "production" ]; then
  # Production: Use multiple workers (adjust based on CPU cores)
  WORKERS=${UVICORN_WORKERS:-4}
  echo "Starting FastAPI in production mode with $WORKERS workers..."
  uv run uvicorn app.main:app --workers $WORKERS --port 8001 --host 0.0.0.0
else
  # Development: Single worker with reload
  echo "Starting FastAPI in development mode (single worker, reload enabled)..."
  uv run uvicorn app.main:app --reload --workers 2 --port 8001 --host 0.0.0.0
fi
