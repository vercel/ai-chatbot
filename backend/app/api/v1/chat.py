import json
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import delete_chat_by_id, get_chat_by_id

router = APIRouter()


class ChatRequest(BaseModel):
    id: UUID
    message: dict  # ChatMessage structure
    selectedChatModel: str
    selectedVisibilityType: str


@router.get("")
async def create_chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or continue a chat conversation.
    Returns a streaming response with AI-generated messages.
    """
    # TODO: Implement chat logic
    # - Validate rate limits
    # - Get or create chat
    # - Save user message
    # - Stream AI response

    async def generate_stream():
        # Placeholder streaming response
        yield f"data: {json.dumps({'type': 'text-delta', 'textDelta': 'Hello! '})}\n\n"
        yield f"data: {json.dumps({'type': 'text-delta', 'textDelta': 'This is a placeholder response. '})}\n\n"
        yield f"data: {json.dumps({'type': 'text-delta', 'textDelta': 'Chat endpoint is not yet fully implemented.'})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
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
