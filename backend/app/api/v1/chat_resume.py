"""Resume stream endpoint for resumable streams."""

import json
import logging
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import get_chat_by_id, get_messages_by_chat_id
from app.models.stream import Stream
from app.utils.helpers import format_sse
from app.utils.resumable_stream import (
    get_stream_chunks,
    is_stream_complete,
    replay_stream_chunks,
)
from app.utils.stream import patch_response_with_headers
from app.utils.user_id import user_ids_match

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{chat_id}/stream")
async def resume_stream(
    chat_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Resume a stream by retrieving chunks from Redis.
    Matches frontend pattern: GET /api/chat/{chat_id}/stream
    Gets the most recent stream_id from the database.
    Returns 204 if stream not found or Redis is not available.
    """
    resume_requested_at = datetime.utcnow()

    # Verify chat exists and user has access
    chat = await get_chat_by_id(db, chat_id)

    if not chat:
        raise ChatSDKError(
            "not_found:chat",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    # Check user access (handles both UUID and session ID formats)
    if chat.visibility == "private":
        if not user_ids_match(current_user["id"], chat.userId):
            raise ChatSDKError(
                "forbidden:chat",
                status_code=status.HTTP_403_FORBIDDEN,
            )

    # Get the most recent stream_id for this chat (like frontend does)
    result = await db.execute(
        select(Stream.id).where(Stream.chatId == chat_id).order_by(desc(Stream.createdAt)).limit(1)
    )
    stream_row = result.first()

    if not stream_row:
        # No streams found for this chat
        return StreamingResponse(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            media_type="text/event-stream",
        )

    stream_id = stream_row[0]

    # Check if Redis is available and get chunks
    chunks = await get_stream_chunks(stream_id)
    if chunks is None:
        # Redis not available or stream not found in Redis
        # Fall back to message-based restoration (like frontend does)
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
                        message_created_at = None

                # If message is recent (within 15 seconds), return empty (frontend will restore)
                if message_created_at and (resume_requested_at - message_created_at) <= timedelta(
                    seconds=15
                ):
                    return StreamingResponse(
                        content=b"",
                        status_code=status.HTTP_200_OK,
                        media_type="text/event-stream",
                    )

        return StreamingResponse(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            media_type="text/event-stream",
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

    # Stream is incomplete - check if there's a saved message to restore
    # Priority: If there's a complete saved message, send that instead of partial chunks
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
                    message_created_at = None
            elif not hasattr(message_created_at, "isoformat"):
                message_created_at = None

            # If message is recent (within 15 seconds), send complete message
            if message_created_at and (resume_requested_at - message_created_at) <= timedelta(
                seconds=15
            ):
                # Convert database message to UI message format
                # Format matches what frontend expects for data-appendMessage
                ui_message = {
                    "id": str(most_recent_message.id),
                    "role": most_recent_message.role,
                    "parts": most_recent_message.parts,
                    "metadata": {
                        "createdAt": (
                            message_created_at.isoformat()
                            if hasattr(message_created_at, "isoformat")
                            else str(message_created_at)
                        ),
                    },
                }

                # Send data-appendMessage event (matches frontend format)
                async def complete_message_generator():
                    append_event = format_sse(
                        {
                            "type": "data-appendMessage",
                            "data": json.dumps(ui_message),
                            "transient": True,
                        }
                    )
                    yield append_event.encode("utf-8")

                response = StreamingResponse(
                    complete_message_generator(),
                    media_type="text/event-stream",
                )
                return patch_response_with_headers(response)

    # No saved message or message is too old - replay partial chunks if available
    if chunks:

        async def partial_chunks_generator():
            async for chunk in replay_stream_chunks(chunks):
                yield chunk

        response = StreamingResponse(
            partial_chunks_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)

    # No chunks and no saved message - return empty
    return StreamingResponse(
        content=b"",
        status_code=status.HTTP_204_NO_CONTENT,
        media_type="text/event-stream",
    )
