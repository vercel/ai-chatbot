# Chat POST Endpoint - Hybrid Migration Plan

## Overview

**Hybrid Approach**: Keep AI streaming in Next.js, move database operations to FastAPI, use FastAPI as proxy.

**Benefits**:
- ✅ Faster implementation (3-4 hours vs 8-12 hours)
- ✅ Lower risk (AI streaming stays in proven Next.js code)
- ✅ Incremental migration path
- ✅ Can migrate AI logic later if needed

## Architecture

```
Frontend
   │
   ├─→ FastAPI /api/chat (POST)
   │      │
   │      ├─→ Database operations (FastAPI)
   │      │   - Get/create chat
   │      │   - Save messages
   │      │   - Rate limiting
   │      │
   │      └─→ Proxy to Next.js /api/chat/stream
   │             │
   │             └─→ Next.js AI streaming
   │                 - AI SDK
   │                 - Tools
   │                 - SSE streaming
   │
   └─→ FastAPI returns SSE stream (proxied from Next.js)
```

## Implementation Plan

### Phase 1: Database Operations in FastAPI (2 hours)

**Goal**: Move database operations from Next.js to FastAPI

#### 1.1 Database Query Functions
- [ ] `get_messages_by_chat_id()` - Fetch messages for chat
- [ ] `save_chat()` - Create new chat
- [ ] `save_messages()` - Save messages (user + assistant)
- [ ] `create_stream_id()` - Create stream ID entry
- [ ] `update_chat_last_context_by_id()` - Update usage context
- [ ] `get_message_count_by_user_id()` - Rate limiting

#### 1.2 FastAPI Endpoint Structure
- [ ] Request validation (Pydantic model)
- [ ] Authentication check
- [ ] Rate limiting check
- [ ] Chat get/create logic
- [ ] Message fetching
- [ ] User message saving

### Phase 2: Proxy to Next.js (1 hour)

**Goal**: Proxy AI streaming request to Next.js

#### 2.1 Proxy Implementation
- [ ] Forward request to Next.js `/api/chat/stream` endpoint
- [ ] Pass required data (messages, model, etc.)
- [ ] Stream response back to frontend
- [ ] Handle errors from Next.js

#### 2.2 Data Transformation
- [ ] Convert FastAPI chat/messages to Next.js format
- [ ] Convert Next.js response back to FastAPI format
- [ ] Ensure SSE format compatibility

### Phase 3: Message Saving Integration (1 hour)

**Goal**: Save assistant messages after streaming completes

#### 3.1 Stream Completion Handling
- [ ] Detect when stream completes
- [ ] Extract assistant messages from stream
- [ ] Save messages to database
- [ ] Update chat context with usage

#### 3.2 Error Handling
- [ ] Handle stream errors
- [ ] Rollback on failure
- [ ] Proper error responses

## Detailed Implementation

### Step 1: Create Database Query Functions

**File**: `backend/app/db/queries/chat_queries.py`

```python
async def get_messages_by_chat_id(session: AsyncSession, chat_id: UUID):
    """Get all messages for a chat, ordered by createdAt."""
    result = await session.execute(
        select(Message)
        .where(Message.chatId == chat_id)
        .order_by(asc(Message.createdAt))
    )
    return result.scalars().all()

async def save_chat(
    session: AsyncSession,
    chat_id: UUID,
    user_id: UUID,
    title: str,
    visibility: str
):
    """Create a new chat."""
    new_chat = Chat(
        id=chat_id,
        userId=user_id,
        title=title,
        visibility=visibility
    )
    session.add(new_chat)
    await session.commit()
    await session.refresh(new_chat)
    return new_chat

async def save_messages(session: AsyncSession, messages: List[dict]):
    """Save multiple messages."""
    # Convert dict to Message objects and save
    # ...

async def create_stream_id(session: AsyncSession, stream_id: UUID, chat_id: UUID):
    """Create a stream ID entry."""
    new_stream = Stream(id=stream_id, chatId=chat_id)
    session.add(new_stream)
    await session.commit()

async def update_chat_last_context_by_id(
    session: AsyncSession,
    chat_id: UUID,
    context: dict
):
    """Update chat's lastContext field."""
    chat = await get_chat_by_id(session, chat_id)
    if chat:
        chat.lastContext = context
        await session.commit()
        await session.refresh(chat)

async def get_message_count_by_user_id(
    session: AsyncSession,
    user_id: UUID,
    hours: int = 24
):
    """Count messages for a user in the last N hours."""
    # ...
```

### Step 2: Create FastAPI Endpoint

**File**: `backend/app/api/v1/chat.py`

```python
@router.post("")
async def create_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or continue a chat conversation.
    Proxies AI streaming to Next.js, handles database operations.
    """
    # 1. Rate limiting check
    message_count = await get_message_count_by_user_id(
        db, current_user["id"], hours=24
    )
    if message_count > MAX_MESSAGES_PER_DAY:
        raise ChatSDKError("rate_limit:chat")

    # 2. Get or create chat
    chat = await get_chat_by_id(db, request.id)
    if chat:
        # Validate ownership
        if str(chat.userId) != current_user["id"]:
            raise ChatSDKError("forbidden:chat")
        # Fetch existing messages
        messages = await get_messages_by_chat_id(db, request.id)
    else:
        # Create new chat (with placeholder title for now)
        chat = await save_chat(
            db,
            request.id,
            UUID(current_user["id"]),
            "New Chat",  # Can generate title later
            request.selectedVisibilityType
        )
        messages = []

    # 3. Save user message
    await save_messages(db, [{
        "id": request.message.id,
        "chatId": request.id,
        "role": "user",
        "parts": request.message.parts,
        "attachments": [],
    }])

    # 4. Create stream ID
    stream_id = uuid4()
    await create_stream_id(db, stream_id, request.id)

    # 5. Proxy to Next.js for AI streaming
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")
    proxy_url = f"{nextjs_url}/api/chat/stream"

    # Prepare request for Next.js
    proxy_request = {
        "id": str(request.id),
        "message": request.message.dict(),
        "selectedChatModel": request.selectedChatModel,
        "selectedVisibilityType": request.selectedVisibilityType,
        "existingMessages": [msg.dict() for msg in messages],
    }

    # Stream response from Next.js
    async def stream_from_nextjs():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                proxy_url,
                json=proxy_request,
                headers={"Authorization": f"Bearer {get_jwt_for_nextjs()}"}
            ) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        stream_from_nextjs(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### Step 3: Create Next.js Proxy Endpoint

**File**: `app/api/chat/stream/route.ts` (NEW)

```typescript
import { auth } from "@/app/(auth)/auth";
import { NextRequest } from "next/server";
// ... existing chat POST logic but adapted for proxy

export async function POST(request: NextRequest) {
  // This endpoint receives requests from FastAPI
  // Contains: id, message, selectedChatModel, existingMessages
  // Returns: SSE stream (same as current POST /api/chat)

  // Reuse existing chat POST logic
  // But use existingMessages from request instead of fetching from DB
}
```

### Step 4: Handle Stream Completion

**Challenge**: How to save assistant messages after stream completes?

**Option A**: Next.js saves messages (current behavior)
- FastAPI proxies stream
- Next.js handles saving (via onFinish callback)
- FastAPI doesn't need to parse stream

**Option B**: FastAPI parses stream and saves
- More complex
- Need to parse SSE format
- Extract messages from stream

**Recommendation**: Option A (simpler)
- Keep message saving in Next.js for now
- Can migrate later if needed

## Data Flow

### Request Flow
```
1. Frontend → FastAPI POST /api/chat
2. FastAPI:
   - Validates request
   - Checks rate limits
   - Gets/creates chat
   - Saves user message
   - Creates stream ID
3. FastAPI → Next.js POST /api/chat/stream
4. Next.js:
   - Streams AI response (SSE)
5. FastAPI → Frontend (proxies SSE stream)
```

### Response Flow
```
1. Next.js streams SSE events
2. FastAPI proxies events to frontend
3. Next.js onFinish callback saves assistant messages
4. (Optional) FastAPI can also save if needed
```

## Benefits of Hybrid Approach

1. **Faster Implementation**
   - No need to migrate AI SDK
   - No need to migrate tools initially
   - Database operations are straightforward

2. **Lower Risk**
   - AI streaming stays in proven code
   - Tools continue to work
   - Can test incrementally

3. **Incremental Migration**
   - Can migrate AI logic later
   - Can migrate tools one by one
   - Database already migrated

4. **Flexibility**
   - Can switch back to Next.js easily
   - Can migrate fully later
   - No breaking changes

## Migration Path

### Phase 1: Hybrid (Current Plan)
- Database in FastAPI
- AI streaming in Next.js
- FastAPI proxies to Next.js

### Phase 2: Full Migration (Future)
- Migrate AI SDK to Python
- Migrate tools to Python
- Remove Next.js dependency

## Testing Strategy

1. **Test Database Operations**
   - Create chat
   - Save messages
   - Rate limiting

2. **Test Proxy**
   - Forward request to Next.js
   - Stream response correctly
   - Handle errors

3. **Test End-to-End**
   - Full chat flow
   - Message persistence
   - Stream completion

## Implementation Checklist

### Database Layer
- [ ] `get_messages_by_chat_id()`
- [ ] `save_chat()`
- [ ] `save_messages()`
- [ ] `create_stream_id()`
- [ ] `update_chat_last_context_by_id()`
- [ ] `get_message_count_by_user_id()`

### FastAPI Endpoint
- [ ] Request validation
- [ ] Authentication
- [ ] Rate limiting
- [ ] Chat get/create
- [ ] Message fetching
- [ ] User message saving
- [ ] Proxy to Next.js
- [ ] Stream proxying

### Next.js Proxy Endpoint
- [ ] New `/api/chat/stream` route
- [ ] Accept FastAPI requests
- [ ] Use existingMessages from request
- [ ] Stream AI response
- [ ] Save assistant messages

### Integration
- [ ] Environment variable for Next.js URL
- [ ] JWT token for FastAPI → Next.js auth
- [ ] Error handling
- [ ] Testing

## Environment Variables

```env
# FastAPI .env
NEXTJS_URL=http://localhost:3000  # Next.js server URL
NEXTJS_INTERNAL_TOKEN=...  # Token for FastAPI → Next.js auth
```

## Next Steps

1. Implement database query functions
2. Create FastAPI endpoint structure
3. Implement proxy to Next.js
4. Create Next.js proxy endpoint
5. Test end-to-end flow

