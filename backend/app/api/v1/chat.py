import json
from datetime import datetime
from typing import List
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import (
    create_stream_id,
    delete_chat_by_id,
    get_chat_by_id,
    get_message_count_by_user_id,
    get_messages_by_chat_id,
    save_chat,
    save_messages,
)

router = APIRouter()

# Rate limiting configuration
ENTITLEMENTS = {
    "guest": {"maxMessagesPerDay": 20},
    "regular": {"maxMessagesPerDay": 100},
}


class MessagePart(BaseModel):
    type: str  # "text" or "file"
    text: str | None = None
    mediaType: str | None = None
    name: str | None = None
    url: str | None = None


class ChatMessage(BaseModel):
    id: UUID
    role: str  # "user"
    parts: List[MessagePart]


class ChatRequest(BaseModel):
    id: UUID
    message: ChatMessage
    selectedChatModel: str  # "chat-model" or "chat-model-reasoning"
    selectedVisibilityType: str  # "public" or "private"


@router.post("")
async def create_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or continue a chat conversation.
    Handles database operations and proxies AI streaming to Next.js.
    """
    user_id = UUID(current_user["id"])
    user_type = current_user.get("type", "regular")

    # 1. Rate limiting check
    message_count = await get_message_count_by_user_id(db, user_id, hours=24)
    max_messages = ENTITLEMENTS.get(user_type, ENTITLEMENTS["regular"])["maxMessagesPerDay"]

    if message_count >= max_messages:
        raise ChatSDKError(
            "rate_limit:chat",
            f"Rate limit exceeded. Maximum {max_messages} messages per day.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # 2. Get or create chat
    chat = await get_chat_by_id(db, request.id)
    existing_messages = []

    if chat:
        # Validate ownership
        if chat.userId != user_id:
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        # Fetch existing messages
        existing_messages = await get_messages_by_chat_id(db, request.id)
    else:
        # Create new chat (with placeholder title - can generate later)
        # TODO: Generate title from user message similar to Next.js: generateTitleFromUserMessage
        chat = await save_chat(
            db,
            request.id,
            user_id,
            title="New Chat",
            visibility=request.selectedVisibilityType,
        )

    # 3. Save user message
    await save_messages(
        db,
        [
            {
                "id": str(request.message.id),
                "chatId": str(request.id),
                "role": "user",
                "parts": [part.dict() for part in request.message.parts],
                "attachments": [],
                "createdAt": datetime.utcnow(),
            }
        ],
    )

    # 4. Create stream ID
    stream_id = uuid4()
    await create_stream_id(db, stream_id, request.id)

    # 5. Proxy to Next.js for AI streaming
    proxy_url = f"{settings.NEXTJS_URL}/api/chat/stream"

    # Prepare request for Next.js
    # Convert existing messages to dict format
    existing_messages_dict = [
        {
            "id": str(msg.id),
            "role": msg.role,
            "parts": msg.parts,
            "attachments": msg.attachments,
            "createdAt": msg.createdAt.isoformat(),
        }
        for msg in existing_messages
    ]

    proxy_request = {
        "id": str(request.id),
        "message": {
            "id": str(request.message.id),
            "role": request.message.role,
            "parts": [part.dict() for part in request.message.parts],
        },
        "selectedChatModel": request.selectedChatModel,
        "selectedVisibilityType": request.selectedVisibilityType,
        "existingMessages": existing_messages_dict,
    }
    stream_request = proxy_request.copy()

    # Stream response from Next.js
    async def stream_from_nextjs():
        try:
            # Add internal API secret for service-to-service authentication
            headers = {
                "Content-Type": "application/json",
                "X-Internal-API-Secret": settings.INTERNAL_API_SECRET,
                "X-User-Id": current_user["id"],  # Pass user ID for Next.js to use
                "X-User-Type": current_user.get("type", "regular"),
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    proxy_url,
                    json=proxy_request,
                    headers=headers,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"data: {json.dumps({'type': 'error', 'error': f'Next.js proxy error: {error_text.decode()}'})}\n\n"
                        yield "data: [DONE]\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        yield chunk
        except Exception as e:
            # Handle connection errors
            error_msg = f"Failed to connect to Next.js: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"
            yield "data: [DONE]\n\n"

    # Stream response from FastAPI stream endpoint
    async def stream_from_fastapi():
        try:
            # Get base URL for internal call
            # In production, this could be configured via env var
            import os

            base_url = os.getenv("FASTAPI_INTERNAL_URL", "http://localhost:8001")
            stream_url = f"{base_url}/api/v1/chat/stream"

            # For internal calls, we can pass auth via header
            # The stream endpoint will use get_current_user which reads from cookies/headers
            headers = {
                "Content-Type": "application/json",
                # Auth will be handled by cookies (if same origin) or we can pass token
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    stream_url,
                    json=stream_request,
                    headers=headers,
                    # Include cookies for authentication
                    cookies={"auth_token": current_user.get("token", "")}
                    if current_user.get("token")
                    else None,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"data: {json.dumps({'type': 'error', 'error': f'FastAPI stream error: {response.status_code} - {error_text.decode()}'})}\n\n"
                        yield "data: [DONE]\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        yield chunk
        except Exception as e:
            # Handle connection errors
            error_msg = f"Failed to connect to FastAPI stream: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        # stream_from_nextjs(),
        stream_from_fastapi(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.delete("")
async def delete_chat(
    chat_id: UUID = Query(..., alias="id"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a chat by ID.
    Returns the deleted chat object.
    """
    # Validate chat exists
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Validate user owns the chat
    if str(chat.userId) != current_user["id"]:
        raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    # Delete the chat (cascade deletes votes, messages, streams)
    deleted_chat = await delete_chat_by_id(db, chat_id)

    if not deleted_chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Convert to dict format matching frontend expectations
    return {
        "id": str(deleted_chat.id),
        "title": deleted_chat.title,
        "createdAt": deleted_chat.createdAt.isoformat(),
        "visibility": deleted_chat.visibility,
        "userId": str(deleted_chat.userId),
        "lastContext": deleted_chat.lastContext,
    }
