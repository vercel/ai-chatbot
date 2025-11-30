# FastAPI Migration Quick Start Guide

This guide provides essential code snippets to get you started quickly.

## 1. Initial Setup

### Create Project Structure
```bash
mkdir backend && cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install fastapi[all] uvicorn[standard] sqlalchemy asyncpg python-jose[cryptography] passlib[bcrypt] pydantic[email] python-multipart httpx python-dotenv
```

### Basic FastAPI App (`app/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Run Server
```bash
uvicorn app.main:app --reload --port 8000
```

## 2. Database Connection

### Database Config (`app/core/database.py`)
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

DATABASE_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost/db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

## 3. Authentication

### JWT Utilities (`app/core/security.py`)
```python
from datetime import datetime, timedelta
from jose import jwt
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

### Auth Dependency (`app/api/deps.py`)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.core.security import decode_access_token

security = HTTPBearer()

async def get_current_user(credentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
```

## 4. Chat Endpoint Example

### Chat Router (`app/api/v1/chat.py`)
```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
import json

router = APIRouter()

@router.post("")
async def create_chat(
    request: dict,
    current_user = Depends(get_current_user)
):
    async def generate_stream():
        # Your streaming logic here
        yield f"data: {json.dumps({'type': 'text-delta', 'textDelta': 'Hello'})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream"
    )
```

## 5. Frontend Integration

### API Client (`lib/api-client.ts`)
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
}
```

### Update Chat Component
```typescript
// In components/chat.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

transport: new DefaultChatTransport({
  api: `${API_URL}/api/chat`,
  fetch: fetchWithErrorHandlers,
  // ... rest
}),
```

## 6. Environment Variables

### Backend `.env`
```env
POSTGRES_URL=postgresql+asyncpg://user:password@localhost:5432/chatbot_db
JWT_SECRET_KEY=your-secret-key-here
XAI_API_KEY=your-xai-api-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

## 7. Testing Endpoints

### Using curl
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Create chat (with token)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"id":"...","message":{...},"selectedChatModel":"chat-model","selectedVisibilityType":"private"}'
```

## 8. Common Patterns

### Error Handling
```python
from fastapi import HTTPException

if not chat:
    raise HTTPException(status_code=404, detail="Chat not found")
```

### Async Database Query
```python
from sqlalchemy import select
from app.models.chat import Chat

async def get_chat(db: AsyncSession, chat_id: UUID):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    return result.scalar_one_or_none()
```

### Streaming Response
```python
async def stream_data():
    async for chunk in your_streaming_source():
        yield f"data: {json.dumps(chunk)}\n\n"
    yield "data: [DONE]\n\n"

return StreamingResponse(stream_data(), media_type="text/event-stream")
```

## Next Steps

1. Follow the detailed [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
2. Start with one endpoint (e.g., `/api/history`)
3. Test thoroughly before moving to the next
4. Use feature flags to switch between backends

