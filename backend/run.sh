#!/bin/bash
# Quick start script for FastAPI backend using uv

# Run the server with uv
uv run uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

