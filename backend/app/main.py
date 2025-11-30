from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import chat, auth, history, vote, document, files

app = FastAPI(
    title="AI Chatbot API",
    version="1.0.0",
    description="FastAPI backend for AI Chatbot application",
    docs_url="/docs",
    redoc_url="/redoc"
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
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(vote.router, prefix="/api/vote", tags=["vote"])
app.include_router(document.router, prefix="/api/document", tags=["document"])
app.include_router(files.router, prefix="/api/files", tags=["files"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/")
async def root():
    return {
        "message": "AI Chatbot API",
        "docs": "/docs",
        "health": "/health"
    }

