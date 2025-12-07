import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, chat, chat_resume, chat_stream, document, files, history, vote
from app.config import settings
from app.core.redis import close_redis_client

# Configure logging BEFORE importing other modules
# This ensures all loggers use this configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,  # Override any existing configuration
)

# Get root logger and ensure it's configured
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Ensure uvicorn loggers also use INFO level
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

# Test logging
logger = logging.getLogger(__name__)
logger.info("=== FastAPI app starting, logging configured ===")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("=== FastAPI app startup ===")
    yield
    # Shutdown
    logger.info("=== FastAPI app shutdown ===")
    await close_redis_client()


app = FastAPI(
    title="AI Chatbot API",
    version="1.0.0",
    description="FastAPI backend for AI Chatbot application",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_stream.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(chat_resume.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(vote.router, prefix="/api/vote", tags=["vote"])
app.include_router(document.router, prefix="/api/document", tags=["document"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "AI Chatbot API", "docs": "/docs", "health": "/health"}


@app.get("/test-log")
async def test_log():
    """Test endpoint to verify logging works."""
    logger.info("=== TEST LOG ENDPOINT CALLED ===")
    logger.warning("This is a WARNING log")
    logger.error("This is an ERROR log")
    return {"status": "ok", "message": "Check terminal for logs"}
