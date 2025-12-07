# FastAPI Backend Migration Plan

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Phase 1: Setup & Infrastructure](#phase-1-setup--infrastructure)
4. [Phase 2: Database Layer](#phase-2-database-layer)
5. [Phase 3: Authentication](#phase-3-authentication)
6. [Phase 4: API Endpoints](#phase-4-api-endpoints)
7. [Phase 5: AI/LLM Integration](#phase-5-aillm-integration)
8. [Phase 6: Frontend Updates](#phase-6-frontend-updates)
9. [Phase 7: Testing & Validation](#phase-7-testing--validation)
10. [Phase 8: Deployment](#phase-8-deployment)
11. [Migration Checklist](#migration-checklist)

---

## Overview

### Current Architecture
- **Frontend**: Next.js 16 with React 19
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **AI/LLM**: Vercel AI SDK with XAI models

### Target Architecture
- **Frontend**: Next.js 16 (frontend only, no API routes)
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy/asyncpg
- **Authentication**: JWT-based auth with FastAPI
- **AI/LLM**: Python AI SDK or direct provider APIs

### Migration Strategy
- **Incremental**: Migrate one endpoint at a time
- **Parallel**: Run both backends during transition
- **Feature Flags**: Use environment variables to switch between backends

---

## Project Structure

### FastAPI Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py                # Configuration & environment variables
│   ├── dependencies.py          # FastAPI dependencies (auth, DB)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py          # Chat endpoints
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── history.py       # Chat history endpoints
│   │   │   ├── vote.py          # Voting endpoints
│   │   │   ├── document.py      # Document endpoints
│   │   │   ├── files.py         # File upload endpoints
│   │   │   └── suggestions.py   # Suggestions endpoints
│   │   └── deps.py              # API dependencies
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py          # JWT, password hashing
│   │   ├── errors.py            # Error handling
│   │   └── database.py         # Database connection
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User SQLAlchemy model
│   │   ├── chat.py              # Chat SQLAlchemy model
│   │   ├── message.py           # Message SQLAlchemy model
│   │   ├── document.py          # Document SQLAlchemy model
│   │   └── vote.py              # Vote SQLAlchemy model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py              # Pydantic schemas for User
│   │   ├── chat.py              # Pydantic schemas for Chat
│   │   ├── message.py           # Pydantic schemas for Message
│   │   └── common.py            # Common schemas
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── chat_service.py      # Chat business logic
│   │   ├── ai_service.py        # AI/LLM integration
│   │   └── document_service.py  # Document operations
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── queries/
│   │   │   ├── __init__.py
│   │   │   ├── user_queries.py
│   │   │   ├── chat_queries.py
│   │   │   ├── message_queries.py
│   │   │   └── document_queries.py
│   │   └── migrations/         # Alembic migrations
│   │
│   └── ai/
│       ├── __init__.py
│       ├── providers.py         # AI provider configuration
│       ├── prompts.py           # System prompts
│       ├── tools/
│       │   ├── __init__.py
│       │   ├── weather.py
│       │   ├── document.py
│       │   └── suggestions.py
│       └── streaming.py         # Streaming utilities
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_chat.py
│   └── test_api/
│
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

---

## Phase 1: Setup & Infrastructure

### 1.1 Create FastAPI Project

```bash
# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi[all] uvicorn[standard]
pip install sqlalchemy asyncpg alembic
pip install python-jose[cryptography] passlib[bcrypt]
pip install pydantic[email] python-multipart
pip install httpx openai  # For AI providers
pip install python-dotenv
```

### 1.2 Dependencies (`requirements.txt`)

```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.1.2

# Validation
pydantic[email]==2.5.3
pydantic-settings==2.1.0

# AI/LLM
openai==1.12.0
httpx==0.26.0

# Utilities
python-dotenv==1.0.0
python-dateutil==2.8.2
uuid==1.30

# Development
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0  # For testing
```

### 1.3 Environment Variables (`.env`)

```env
# Database
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db
POSTGRES_URL_SYNC=postgresql://user:password@localhost:5432/chatbot_db

# Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI/LLM
XAI_API_KEY=your-xai-api-key
AI_GATEWAY_URL=https://api.vercel.com/v1/ai/gateway  # If using Vercel AI Gateway

# Application
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Vercel Blob (for file uploads)
BLOB_READ_WRITE_TOKEN=your-blob-token
```

### 1.4 FastAPI App Setup (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import chat, auth, history, vote, document, files, suggestions

app = FastAPI(
    title="AI Chatbot API",
    version="1.0.0",
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
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
```

### 1.5 Configuration (`app/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    POSTGRES_URL: str
    POSTGRES_URL_SYNC: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    XAI_API_KEY: str
    AI_GATEWAY_URL: str = ""

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Blob
    BLOB_READ_WRITE_TOKEN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## Phase 2: Database Layer

### 2.1 SQLAlchemy Models

#### `app/models/user.py`
```python
from sqlalchemy import Column, String, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class User(Base):
    __tablename__ = "User"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(64), nullable=True)

    # Relationships
    chats = relationship("Chat", back_populates="user")
```

#### `app/models/chat.py`
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class Chat(Base):
    __tablename__ = "Chat"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    title = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False)
    visibility = Column(String, nullable=False, default="private")
    last_context = Column(JSONB, nullable=True)

    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat")
```

#### `app/models/message.py`
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid

class Message(Base):
    __tablename__ = "Message_v2"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=False)
    role = Column(String, nullable=False)
    parts = Column(JSON, nullable=False)
    attachments = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
```

### 2.2 Database Connection (`app/core/database.py`)

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

engine = create_async_engine(
    settings.POSTGRES_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 2.3 Database Queries

Port all functions from `lib/db/queries.ts` to Python. Example:

#### `app/db/queries/chat_queries.py`
```python
from sqlalchemy import select, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.chat import Chat
from app.models.message import Message
from typing import Optional, List

async def get_chat_by_id(session: AsyncSession, chat_id: UUID):
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id)
    )
    return result.scalar_one_or_none()

async def get_chats_by_user_id(
    session: AsyncSession,
    user_id: UUID,
    limit: int = 10,
    starting_after: Optional[UUID] = None,
    ending_before: Optional[UUID] = None
):
    query = select(Chat).where(Chat.user_id == user_id)

    if starting_after:
        query = query.where(Chat.id > starting_after).order_by(asc(Chat.id))
    elif ending_before:
        query = query.where(Chat.id < ending_before).order_by(desc(Chat.id))
    else:
        query = query.order_by(desc(Chat.created_at))

    query = query.limit(limit)
    result = await session.execute(query)
    return result.scalars().all()

async def save_chat(
    session: AsyncSession,
    chat_id: UUID,
    user_id: UUID,
    title: str,
    visibility: str
):
    chat = Chat(
        id=chat_id,
        user_id=user_id,
        title=title,
        visibility=visibility
    )
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat
```

### 2.4 Alembic Migrations

```bash
# Initialize Alembic
alembic init alembic

# Create initial migration from existing schema
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

**Note**: Since the database already exists, you may need to:
1. Generate migrations from existing schema
2. Mark them as already applied: `alembic stamp head`

---

## Phase 3: Authentication

### 3.1 JWT Utilities (`app/core/security.py`)

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

### 3.2 Authentication Dependency (`app/api/deps.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_access_token
from app.db.queries.user_queries import get_user_by_id

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

### 3.3 Auth Endpoints (`app/api/v1/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.db.queries.user_queries import get_user_by_email, create_user, create_guest_user
from datetime import timedelta
from app.config import settings

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_email(db, request.email)

    if not user or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "type": "regular"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "regular"
        }
    }

@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    existing_user = await get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(request.password)
    user = await create_user(db, request.email, hashed_password)

    access_token = create_access_token(
        data={"sub": str(user.id), "type": "regular"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "regular"
        }
    }

@router.post("/guest", response_model=TokenResponse)
async def create_guest(
    db: AsyncSession = Depends(get_db)
):
    user = await create_guest_user(db)

    access_token = create_access_token(
        data={"sub": str(user.id), "type": "guest"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "guest"
        }
    }
```

---

## Phase 4: API Endpoints

### 4.1 Chat Endpoint (`app/api/v1/chat.py`)

**Key Requirements:**
- POST `/api/chat` - Create/continue chat with streaming
- DELETE `/api/chat?id={id}` - Delete chat
- Support SSE streaming for AI responses
- Rate limiting
- Authentication

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
import json
import asyncio

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.chat_service import ChatService
from app.services.ai_service import AIService

router = APIRouter()

class ChatRequest(BaseModel):
    id: UUID
    message: dict  # ChatMessage structure
    selectedChatModel: str
    selectedVisibilityType: str

@router.post("")
async def create_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    chat_service = ChatService(db)
    ai_service = AIService()

    # Validate rate limits
    message_count = await chat_service.get_message_count_by_user_id(
        current_user.id, hours=24
    )
    # Check entitlements...

    # Get or create chat
    chat = await chat_service.get_or_create_chat(
        request.id,
        current_user.id,
        request.message,
        request.selectedVisibilityType
    )

    # Stream AI response
    async def generate_stream():
        async for chunk in ai_service.stream_chat_response(
            chat_id=request.id,
            message=request.message,
            model=request.selectedChatModel,
            user_id=current_user.id
        ):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.delete("")
async def delete_chat(
    chat_id: UUID = Query(..., alias="id"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    chat_service = ChatService(db)
    chat = await chat_service.get_chat_by_id(chat_id)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await chat_service.delete_chat(chat_id)
    return {"status": "deleted"}
```

### 4.2 History Endpoint (`app/api/v1/history.py`)

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.db.queries.chat_queries import get_chats_by_user_id, delete_all_chats_by_user_id

router = APIRouter()

@router.get("")
async def get_chat_history(
    limit: int = Query(10, ge=1, le=100),
    starting_after: Optional[UUID] = None,
    ending_before: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if starting_after and ending_before:
        raise HTTPException(
            status_code=400,
            detail="Only one of starting_after or ending_before can be provided"
        )

    chats = await get_chats_by_user_id(
        db,
        current_user.id,
        limit=limit,
        starting_after=starting_after,
        ending_before=ending_before
    )

    return [{
        "id": str(chat.id),
        "title": chat.title,
        "createdAt": chat.created_at.isoformat(),
        "visibility": chat.visibility
    } for chat in chats]

@router.delete("")
async def delete_all_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await delete_all_chats_by_user_id(db, current_user.id)
    return {"deleted": result}
```

### 4.3 Vote Endpoint (`app/api/v1/vote.py`)

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.db.queries.chat_queries import get_chat_by_id
from app.db.queries.vote_queries import get_votes_by_chat_id, vote_message

router = APIRouter()

class VoteRequest(BaseModel):
    chatId: UUID
    messageId: UUID
    type: str  # "up" or "down"

@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    chat = await get_chat_by_id(db, chatId)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    votes = await get_votes_by_chat_id(db, chatId)
    return votes

@router.patch("")
async def vote(
    request: VoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    chat = await get_chat_by_id(db, request.chatId)

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await vote_message(
        db,
        request.chatId,
        request.messageId,
        request.type
    )

    return {"status": "voted"}
```

### 4.4 Document Endpoint (`app/api/v1/document.py`)

Similar structure to vote endpoint - port the logic from `app/(chat)/api/document/route.ts`

### 4.5 Files Upload Endpoint (`app/api/v1/files.py`)

```python
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate file size (5MB max)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size should be less than 5MB")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="File type should be JPEG or PNG")

    # Upload to Vercel Blob
    file_content = await file.read()

    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"https://blob.vercel-storage.com/{file.filename}",
            content=file_content,
            headers={
                "Authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                "Content-Type": file.content_type
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Upload failed")

    data = response.json()
    return {
        "url": data["url"],
        "pathname": data["pathname"],
        "contentType": file.content_type
    }
```

---

## Phase 5: AI/LLM Integration

### 5.1 AI Service (`app/services/ai_service.py`)

```python
from typing import AsyncIterator, Dict, Any
from uuid import UUID
import httpx
import json
from app.config import settings
from app.ai.providers import get_model_provider
from app.ai.prompts import get_system_prompt

class AIService:
    def __init__(self):
        self.provider = get_model_provider()

    async def stream_chat_response(
        self,
        chat_id: UUID,
        message: Dict[str, Any],
        model: str,
        user_id: UUID
    ) -> AsyncIterator[Dict[str, Any]]:
        # Convert message format
        # Call AI provider
        # Stream responses in the format expected by frontend
        # Format: {"type": "text-delta", "textDelta": "..."}

        async for chunk in self.provider.stream_completion(
            messages=[message],
            model=model,
            system_prompt=get_system_prompt(model)
        ):
            # Transform to frontend format
            yield {
                "type": "text-delta",
                "textDelta": chunk
            }
```

### 5.2 AI Provider (`app/ai/providers.py`)

```python
from typing import AsyncIterator
import httpx
from app.config import settings

class XAIProvider:
    def __init__(self):
        self.api_key = settings.XAI_API_KEY
        self.base_url = "https://api.x.ai/v1"

    async def stream_completion(
        self,
        messages: list,
        model: str,
        system_prompt: str
    ) -> AsyncIterator[str]:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        *messages
                    ],
                    "stream": True
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]

def get_model_provider():
    return XAIProvider()
```

### 5.3 AI Tools

Port all tools from `lib/ai/tools/`:
- `get-weather.ts` → `app/ai/tools/weather.py`
- `create-document.ts` → `app/ai/tools/document.py`
- `update-document.ts` → `app/ai/tools/document.py`
- `request-suggestions.ts` → `app/ai/tools/suggestions.py`

---

## Phase 6: Frontend Updates

### 6.1 Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

### 6.2 API Client (`lib/api-client.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_FASTAPI = process.env.NEXT_PUBLIC_USE_FASTAPI_BACKEND === 'true';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = USE_FASTAPI
    ? `${API_URL}${endpoint}`
    : endpoint; // Use Next.js API routes

  return fetch(url, {
    ...options,
    headers,
  });
}
```

### 6.3 Update Chat Component

Modify `components/chat.tsx` to use the new API client:

```typescript
// In useChat hook
transport: new DefaultChatTransport({
  api: USE_FASTAPI ? `${API_URL}/api/chat` : "/api/chat",
  fetch: fetchWithErrorHandlers,
  // ... rest of config
}),
```

### 6.4 Authentication Updates

Replace NextAuth with JWT-based auth:

```typescript
// lib/auth.ts
export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('auth_token', data.access_token);
    return data.user;
  }

  throw new Error('Login failed');
}
```

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

```python
# tests/test_chat.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_chat():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={
                "id": "test-id",
                "message": {"role": "user", "parts": [{"type": "text", "text": "Hello"}]},
                "selectedChatModel": "chat-model",
                "selectedVisibilityType": "private"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == 200
```

### 7.2 Integration Tests

Test each endpoint with real database connections (use test database).

### 7.3 Frontend-Backend Integration

1. Test all API calls from frontend
2. Verify streaming works correctly
3. Test authentication flow
4. Validate error handling

---

## Phase 8: Deployment

### 8.1 FastAPI Deployment Options

**Option A: Vercel (Serverless Functions)**
- Use `vercel-python` runtime
- May have cold start issues

**Option B: Railway/Render/Fly.io**
- Full container deployment
- Better for long-running connections (streaming)

**Option C: Docker + Cloud Provider**
- Most flexible
- Deploy to AWS/GCP/Azure

### 8.2 Environment Setup

```bash
# Production .env
POSTGRES_URL=postgresql+asyncpg://...
JWT_SECRET_KEY=<strong-secret>
XAI_API_KEY=<production-key>
CORS_ORIGINS=https://yourdomain.com
```

### 8.3 Monitoring

- Add logging (structlog)
- Add error tracking (Sentry)
- Add metrics (Prometheus)

---

## Migration Checklist

### Pre-Migration
- [ ] Set up FastAPI project structure
- [ ] Install all dependencies
- [ ] Configure environment variables
- [ ] Set up database connection

### Database
- [ ] Create SQLAlchemy models
- [ ] Port all database queries
- [ ] Test database operations
- [ ] Set up Alembic migrations

### Authentication
- [ ] Implement JWT utilities
- [ ] Create auth endpoints
- [ ] Port user management
- [ ] Test authentication flow

### API Endpoints (One by one)
- [ ] `/api/auth/*` - Authentication
- [ ] `/api/chat` - Main chat endpoint
- [ ] `/api/chat/{id}/stream` - Streaming
- [ ] `/api/history` - Chat history
- [ ] `/api/vote` - Voting
- [ ] `/api/document` - Documents
- [ ] `/api/files/upload` - File uploads
- [ ] `/api/suggestions` - Suggestions

### AI/LLM
- [ ] Port AI provider configuration
- [ ] Implement streaming
- [ ] Port all AI tools
- [ ] Test AI responses

### Frontend
- [ ] Create API client
- [ ] Update authentication
- [ ] Update all API calls
- [ ] Test with FastAPI backend
- [ ] Add feature flag for switching

### Testing
- [ ] Unit tests for all endpoints
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Load testing

### Deployment
- [ ] Deploy FastAPI backend
- [ ] Update frontend environment variables
- [ ] Test in production-like environment
- [ ] Monitor for errors
- [ ] Gradually migrate traffic

### Post-Migration
- [ ] Remove Next.js API routes
- [ ] Remove NextAuth
- [ ] Clean up unused dependencies
- [ ] Update documentation

---

## Estimated Timeline

- **Phase 1-2**: 1-2 days (Setup & Database)
- **Phase 3**: 1 day (Authentication)
- **Phase 4**: 3-5 days (API Endpoints)
- **Phase 5**: 2-3 days (AI/LLM)
- **Phase 6**: 2 days (Frontend)
- **Phase 7**: 2-3 days (Testing)
- **Phase 8**: 1-2 days (Deployment)

**Total**: ~2-3 weeks for a complete migration

---

## Risks & Mitigation

1. **Streaming Complexity**: FastAPI SSE is different from Next.js streaming
   - *Mitigation*: Test thoroughly, use async generators

2. **Authentication Migration**: Users may need to re-login
   - *Mitigation*: Implement token migration or dual auth during transition

3. **Type Safety**: Lose TypeScript type safety between frontend/backend
   - *Mitigation*: Use OpenAPI schema generation, validate with Pydantic

4. **Performance**: Python may be slower for some operations
   - *Mitigation*: Use async/await, optimize database queries

5. **Deployment Complexity**: Two services instead of one
   - *Mitigation*: Use Docker Compose for local, orchestration for production

---

## Next Steps

1. Review this plan
2. Set up FastAPI project structure
3. Start with Phase 1 (Setup)
4. Migrate one endpoint at a time
5. Test thoroughly before moving to next phase
