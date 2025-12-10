"""Chat streaming endpoint using aisuite + OpenAI.

This endpoint handles AI streaming and replaces the Next.js /api/chat/stream endpoint.
"""

import asyncio
import logging
import traceback
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_async_ai_client, get_model_name
from app.ai.prompts import get_system_prompt
from app.api.deps import get_current_user
from app.api.v1.schemas.chat_schemas import StreamRequest
from app.api.v1.utils.background_tasks import (
    create_save_messages_task,
    create_update_context_task,
)
from app.api.v1.utils.continue_stream import _continue_stream_in_background
from app.api.v1.utils.tool_setup import prepare_tools
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import create_stream_id
from app.utils.message_converter import convert_messages_to_openai_format
from app.utils.resumable_stream import (
    mark_stream_complete,
    store_stream_chunk,
)
from app.utils.stream import patch_response_with_headers
from app.utils.stream_processor import StreamEventProcessor
from app.utils.user_id import get_user_id_uuid

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/stream")
async def stream_chat(
    request: StreamRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream AI response for a chat.
    This replaces the Next.js /api/chat/stream endpoint.
    """
    logger.info("=== STREAM CHAT ENDPOINT CALLED ===")
    logger.info("Chat ID: %s", request.id)
    logger.info("User ID: %s", current_user.get("id"))
    try:
        user_id = get_user_id_uuid(current_user["id"])

        # 1. Prepare messages
        # Combine existing messages with the new user message
        all_messages = []
        for msg in request.existingMessages:
            all_messages.append(
                {
                    "id": str(msg["id"]),
                    "role": msg["role"],
                    "parts": msg["parts"],
                    "attachments": msg["attachments"] or [],
                    "createdAt": msg["createdAt"],
                }
            )

        # Add the new user message
        all_messages.append(
            {
                "id": str(request.message.id),
                "role": request.message.role,
                "parts": [part.dict() for part in request.message.parts],
                "attachments": [],
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

        # 2. Convert messages to OpenAI format (fetches file data from database)
        openai_messages = await convert_messages_to_openai_format(all_messages, db)

        # 3. Get system prompt
        # TODO: Get geolocation hints from request headers or frontend
        request_hints = None  # Will be implemented later
        system = get_system_prompt(request.selectedChatModel, request_hints)

        # 4. Get async AI client for streaming and model name
        client = get_async_ai_client()
        model = get_model_name(request.selectedChatModel)

        # 5. Prepare tools
        tools, tool_definitions = await prepare_tools(user_id, db)
        logger.info("tool_definitions: %s", tool_definitions)

        # 6. Get or create stream ID for resumable streams
        stream_id = request.streamId
        if not stream_id:
            stream_id = uuid4()
            await create_stream_id(db, stream_id, request.id)

        # 7. Create stream processor
        processor = StreamEventProcessor(request.id)

        # 8. Create stream generator with non-blocking Redis storage
        # Track if stream was interrupted (client disconnect) vs completed normally
        stream_interrupted = False

        async def stream_generator():
            nonlocal stream_interrupted
            sequence = 0  # Sequence counter for ordering chunks
            try:
                async for event_bytes in processor.process_stream(
                    client=client,
                    model=model,
                    messages=openai_messages,
                    system=system,
                    tools=tools,
                    tool_definitions=tool_definitions,
                ):
                    # Store chunk in Redis asynchronously with sequence number
                    # Sequence ensures chunks are stored/retrieved in order
                    # This doesn't block the stream output
                    current_sequence = sequence
                    sequence += 1
                    asyncio.create_task(
                        store_stream_chunk(stream_id, event_bytes, current_sequence)
                    )
                    yield event_bytes
            except GeneratorExit:
                # Client disconnected (browser refresh, navigation, etc.)
                # Don't mark as complete - stream should continue in background
                stream_interrupted = True
                logger.info(
                    "Stream interrupted (client disconnect) for stream_id=%s, chat_id=%s",
                    stream_id,
                    request.id,
                )
                # Continue stream in background even though client disconnected
                asyncio.create_task(
                    _continue_stream_in_background(
                        stream_id=stream_id,
                        chat_id=request.id,
                        client=client,
                        model=model,
                        messages=openai_messages,
                        system=system,
                        tools=tools,
                        tool_definitions=tool_definitions,
                        background_tasks=background_tasks,
                        processor=processor,
                        current_sequence=sequence,
                    )
                )
                raise  # Re-raise to properly close the generator
            finally:
                # Only mark as complete if stream finished normally (not interrupted)
                if not stream_interrupted:
                    # Mark stream as complete in Redis (non-blocking)
                    asyncio.create_task(mark_stream_complete(stream_id))

                    # Schedule background tasks after stream completes (even on error)
                    create_save_messages_task(
                        background_tasks, request.id, processor.assistant_messages
                    )
                    if processor.final_usage:
                        create_update_context_task(
                            background_tasks, request.id, processor.final_usage
                        )

        response = StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)

    except Exception as e:
        stack_trace = traceback.format_exc()
        if isinstance(e, ChatSDKError):
            raise
        raise ChatSDKError(
            "offline:chat",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in stream_chat: {e}\n{stack_trace}",
        )
