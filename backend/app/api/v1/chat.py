import asyncio
import json
import logging
from datetime import datetime
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_ai_client, get_async_ai_client, get_model_name
from app.ai.prompts import get_system_prompt
from app.api.deps import get_current_user
from app.api.v1.utils.background_tasks import (
    create_save_messages_task,
    create_update_context_task,
)
from app.api.v1.utils.continue_stream import _continue_stream_in_background
from app.api.v1.utils.tool_setup import prepare_tools
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
from app.db.queries.user_queries import get_or_create_user_for_session
from app.utils.message_converter import convert_messages_to_openai_format
from app.utils.resumable_stream import mark_stream_complete, store_stream_chunk
from app.utils.stream import patch_response_with_headers
from app.utils.stream_processor import StreamEventProcessor
from app.utils.user_id import get_user_id_uuid, is_session_id, user_ids_match

logger = logging.getLogger(__name__)
logger.info("=== CHAT ENDPOINT CALLED ===")

router = APIRouter()

# Rate limiting configuration
ENTITLEMENTS = {
    "guest": {"maxMessagesPerDay": 50},
    "regular": {"maxMessagesPerDay": 100},
}

# Title generation prompt (ported from lib/ai/prompts.ts)
TITLE_PROMPT = """
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
"""


# ruff: noqa: N815
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


def get_text_from_message(message: ChatMessage) -> str:
    """
    Extract text content from a chat message.
    Ported from lib/utils.ts getTextFromMessage.
    """
    return "".join(part.text for part in message.parts if part.type == "text" and part.text)


async def generate_title_from_user_message(message: ChatMessage) -> str:
    """
    Generate a chat title from the user's first message.
    Ported from app/(chat)/actions.ts generateTitleFromUserMessage.
    """
    client = get_ai_client()
    model = get_model_name("title-model")
    text = get_text_from_message(message)

    # Generate title using OpenAI (non-streaming)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": TITLE_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0.7,
        max_tokens=100,  # Limit to keep titles short
    )

    title = response.choices[0].message.content or "New Chat"
    # Clean up title - remove quotes and colons, trim whitespace
    title = title.strip().strip('"').strip("'").replace(":", "").strip()
    # Ensure it's not more than 80 characters
    if len(title) > 80:
        title = title[:77] + "..."
    return title or "New Chat"


@router.post("")
async def create_chat(
    request: ChatRequest,
    http_request: Request,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or continue a chat conversation.
    Handles database operations and proxies AI streaming to Next.js.
    """
    logger.info("=== POST /api/chat called ===")
    logger.info(
        "current_user_id=%s (raw), request.id=%s, X-Session-Id header=%s",
        current_user.get("id"),
        request.id,
        http_request.headers.get("X-Session-Id"),
    )

    user_id = get_user_id_uuid(current_user["id"])
    user_type = current_user.get("type", "regular")

    logger.info(
        "User ID conversion: current_user_id=%s -> uuid=%s (type=%s)",
        current_user["id"],
        user_id,
        type(user_id).__name__,
    )

    # 0. Ensure user exists in database (required for foreign key constraint)
    # When auth is disabled, session IDs need corresponding user records
    if settings.DISABLE_AUTH or is_session_id(current_user["id"]):
        logger.info("Ensuring user exists for session: user_id=%s", user_id)
        await get_or_create_user_for_session(db, user_id)

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
    messages_from_db = []  # messagesFromDb

    if chat:
        logger.info(
            "Existing chat found: id=%s, userId=%s (type=%s), current_user_id_uuid=%s",
            chat.id,
            chat.userId,
            type(chat.userId).__name__,
            user_id,
        )
        # Validate ownership
        if chat.userId != user_id:
            logger.warning(
                "Chat ownership mismatch: chat.userId=%s != current_user_id_uuid=%s",
                chat.userId,
                user_id,
            )
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

        # Fetch existing messages
        messages_from_db = await get_messages_by_chat_id(db, request.id)

        # Prepare request for Next.js
        # Convert existing messages to dict format
        messages_from_db = [
            {
                "id": str(msg.id),
                "role": msg.role,
                "parts": msg.parts,
                "attachments": msg.attachments,
                "createdAt": msg.createdAt.isoformat(),
            }
            for msg in messages_from_db
        ]
        logger.info("messages_from_db: %s", json.dumps(messages_from_db, indent=4))

    else:
        # Create new chat - generate title from user message
        logger.info(
            "Creating new chat: id=%s, userId=%s, visibility=%s",
            request.id,
            user_id,
            request.selectedVisibilityType,
        )
        # Generate title from user message
        title = await generate_title_from_user_message(request.message)
        logger.info("Generated title: %s", title)
        chat = await save_chat(
            db,
            request.id,
            user_id,
            title=title,
            visibility=request.selectedVisibilityType,
        )
        logger.info(
            "Chat created: id=%s, userId=%s (stored in DB)",
            chat.id,
            chat.userId,
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

    # 5. Prepare for AI streaming (direct call, no HTTP proxy)
    # Combine existing messages with the new user message for AI context
    all_messages = []
    for msg in messages_from_db:
        all_messages.append(
            {
                "id": str(msg["id"]),
                "role": msg["role"],
                "parts": msg["parts"],
                "attachments": msg.get("attachments") or [],
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

    # Convert messages to OpenAI format (fetches file data from database)
    openai_messages = await convert_messages_to_openai_format(all_messages, db)

    # Get system prompt
    request_hints = None  # Will be implemented later
    system = get_system_prompt(request.selectedChatModel, request_hints)

    # Get async AI client for streaming and model name
    client = get_async_ai_client()
    model = get_model_name(request.selectedChatModel)

    # Prepare tools
    tools, tool_definitions = await prepare_tools(user_id, db)
    logger.info("tool_definitions: %s", tool_definitions)

    # Create stream processor
    processor = StreamEventProcessor(request.id)

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
                current_sequence = sequence
                sequence += 1
                asyncio.create_task(
                    store_stream_chunk(stream_id, event_bytes, current_sequence)
                )
                yield event_bytes
        except GeneratorExit:
            # Client disconnected (browser refresh, navigation, etc.)
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

                # Schedule background tasks after stream completes
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
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

    return patch_response_with_headers(response)


@router.get("/{chat_id}")
async def get_chat(
    chat_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a chat by ID with its messages.
    Returns chat data, messages, and ownership status for the current user.
    """
    logger.info("=== GET /api/chat/%s called ===", chat_id)
    logger.info("current_user_id=%s", current_user.get("id"))

    # Get chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # Check access permissions
    if chat.visibility == "private":
        if not user_ids_match(current_user["id"], chat.userId):
            raise ChatSDKError("forbidden:chat", status_code=status.HTTP_403_FORBIDDEN)

    # Get messages
    messages = await get_messages_by_chat_id(db, chat_id)

    # Check ownership for readonly status
    is_owner = user_ids_match(current_user["id"], chat.userId)

    # Convert to response format
    return {
        "chat": {
            "id": str(chat.id),
            "title": chat.title,
            "createdAt": chat.createdAt.isoformat(),
            "visibility": chat.visibility,
            "userId": str(chat.userId),
            "lastContext": chat.lastContext,
        },
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "parts": msg.parts,
                "attachments": msg.attachments,
                "createdAt": msg.createdAt.isoformat(),
            }
            for msg in messages
        ],
        "isOwner": is_owner,
    }


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
    if not user_ids_match(current_user["id"], chat.userId):
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
