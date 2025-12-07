"""Resume stream endpoint for resumable streams."""

import logging
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import get_chat_by_id, get_messages_by_chat_id
from app.models.stream import Stream
from app.utils.resumable_stream import (
    get_stream_chunks,
    is_stream_complete,
    replay_stream_chunks,
)
from app.utils.stream import patch_response_with_headers

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{chat_id}/stream/{stream_id}")
async def resume_stream(
    chat_id: UUID,
    stream_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Resume a stream by retrieving chunks from Redis.
    Returns 204 if stream not found or Redis is not available.
    """
    resume_requested_at = datetime.utcnow()

    # Check if Redis is available
    chunks = await get_stream_chunks(stream_id)
    if chunks is None:
        # Redis not available or stream not found
        return StreamingResponse(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            media_type="text/event-stream",
        )

    # Verify chat exists and user has access
    chat = await get_chat_by_id(db, chat_id)

    if not chat:
        raise ChatSDKError(
            "not_found:chat",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    # Check if stream belongs to chat
    result = await db.execute(select(Stream).where(Stream.id == stream_id))
    stream = result.scalar_one_or_none()

    if not stream or stream.chatId != chat_id:
        raise ChatSDKError(
            "not_found:stream",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    # Check user access
    user_id = current_user.get("id")
    if chat.visibility == "private" and str(chat.userId) != user_id:
        raise ChatSDKError(
            "forbidden:chat",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    # Check if stream is complete
    if await is_stream_complete(stream_id):
        # Stream is complete, replay all chunks
        async def replay_generator():
            async for chunk in replay_stream_chunks(chunks):
                yield chunk

        response = StreamingResponse(
            replay_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)

    # Stream is still active or incomplete
    # Check if we should return the most recent message instead
    # (similar to frontend logic)
    messages = await get_messages_by_chat_id(db, chat_id)
    if messages:
        most_recent_message = messages[-1]

        if most_recent_message.role == "assistant":
            message_created_at = most_recent_message.createdAt
            # Handle datetime object or string
            if isinstance(message_created_at, str):
                try:
                    message_created_at = datetime.fromisoformat(
                        message_created_at.replace("Z", "+00:00")
                    )
                except ValueError:
                    # If parsing fails, skip this check
                    message_created_at = None

            # If message is recent (within 15 seconds), return it
            if message_created_at and (resume_requested_at - message_created_at) <= timedelta(
                seconds=15
            ):
                # Return empty stream (frontend will handle message restoration)
                return StreamingResponse(
                    content=b"",
                    status_code=status.HTTP_200_OK,
                    media_type="text/event-stream",
                )

    # Return empty stream
    return StreamingResponse(
        content=b"",
        status_code=status.HTTP_204_NO_CONTENT,
        media_type="text/event-stream",
    )
