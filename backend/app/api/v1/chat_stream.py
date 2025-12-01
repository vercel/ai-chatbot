"""
Chat streaming endpoint using aisuite + OpenAI.
This endpoint handles AI streaming and replaces the Next.js /api/chat/stream endpoint.
"""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_ai_client, get_model_name
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import (
    get_messages_by_chat_id,
    save_messages,
    update_chat_last_context_by_id,
)
from app.utils.stream import patch_response_with_headers, stream_text

router = APIRouter()


class MessagePart(BaseModel):
    type: str  # "text" or "file"
    text: Optional[str] = None
    mediaType: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None


class ChatMessage(BaseModel):
    id: UUID
    role: str  # "user" or "assistant"
    parts: List[MessagePart]


class StreamRequest(BaseModel):
    id: UUID
    message: ChatMessage
    selectedChatModel: str  # "chat-model" or "chat-model-reasoning"
    selectedVisibilityType: str  # "public" or "private"
    existingMessages: List[Dict[str, Any]] = []


def get_system_prompt(
    selected_chat_model: str,
    request_hints: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generate system prompt based on model and request hints.
    Ported from lib/ai/prompts.ts
    """
    regular_prompt = "You are a friendly assistant! Keep your responses concise and helpful."

    artifacts_prompt = """
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. ```python`code here```. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: `createDocument` and `updateDocument`, which render content on a artifacts beside the conversation.

**When to use `createDocument`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use `createDocument`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using `updateDocument`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use `updateDocument`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
"""

    # Build request hints prompt
    request_prompt = ""
    if request_hints:
        lat = request_hints.get("latitude", "")
        lon = request_hints.get("longitude", "")
        city = request_hints.get("city", "")
        country = request_hints.get("country", "")
        request_prompt = f"""
About the origin of user's request:
- lat: {lat}
- lon: {lon}
- city: {city}
- country: {country}
"""

    if selected_chat_model == "chat-model-reasoning":
        return f"{regular_prompt}\n\n{request_prompt}".strip()

    return f"{regular_prompt}\n\n{request_prompt}\n\n{artifacts_prompt}".strip()


def convert_messages_to_openai_format(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert messages from database format to OpenAI format.
    Handles both text and file parts.
    """
    openai_messages = []

    for msg in messages:
        role = msg["role"]
        parts = msg.get("parts", [])

        # Build content array for OpenAI format
        content = []
        for part in parts:
            if part.get("type") == "text":
                content.append({"type": "text", "text": part.get("text", "")})
            elif part.get("type") == "file":
                # OpenAI format for images
                content.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": part.get("url", "")},
                    }
                )

        if content:
            openai_messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

    return openai_messages


@router.post("/stream")
async def stream_chat(
    request: StreamRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream AI response for a chat.
    This replaces the Next.js /api/chat/stream endpoint.
    """
    try:
        user_id = UUID(current_user["id"])

        # 1. Get existing messages from database
        existing_messages = await get_messages_by_chat_id(db, request.id)

        # 2. Convert messages to OpenAI format
        # Combine existing messages with the new user message
        all_messages = []
        for msg in existing_messages:
            all_messages.append(
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "parts": msg.parts,
                    "attachments": msg.attachments or [],
                    "createdAt": msg.createdAt.isoformat(),
                }
            )

        # Add the new user message
        all_messages.append(
            {
                "id": str(request.message.id),
                "role": request.message.role,
                "parts": [part.dict() for part in request.message.parts],
                "attachments": [],
            }
        )

        # Convert to OpenAI format
        openai_messages = convert_messages_to_openai_format(all_messages)

        # 3. Get system prompt
        # TODO: Get geolocation hints from request headers or frontend
        request_hints = None  # Will be implemented later
        system = get_system_prompt(request.selectedChatModel, request_hints)

        # 4. Get AI client and model
        client = get_ai_client()
        model = get_model_name(request.selectedChatModel)

        # 5. Stream response
        # TODO: Add tools (getWeather, createDocument, updateDocument, requestSuggestions)
        # For now, streaming without tools
        tool_definitions = None
        tools = None

        # Track usage and messages for saving
        final_usage: Optional[Dict[str, Any]] = None
        assistant_messages: List[Dict[str, Any]] = []

        async def stream_generator():
            nonlocal final_usage, assistant_messages

            message_buffer = ""
            current_message_id: Optional[str] = None

            async for event in stream_text(
                client=client,
                model=model,
                messages=openai_messages,
                system=system,
                tools=tools,
                tool_definitions=tool_definitions,
                temperature=0.7,
            ):
                # Parse SSE event to extract data
                if event.startswith("data: "):
                    data_str = event[6:].strip()
                    if data_str == "[DONE]":
                        yield event
                        break

                    try:
                        data = json.loads(data_str)
                        event_type = data.get("type")

                        # Track usage
                        if event_type == "finish":
                            metadata = data.get("messageMetadata", {})
                            usage = metadata.get("usage")
                            if usage:
                                final_usage = usage

                        # Track text deltas for message saving
                        if event_type == "text-delta":
                            message_buffer += data.get("delta", "")
                        elif event_type == "text-end":
                            # Save accumulated message
                            if message_buffer and current_message_id:
                                assistant_messages.append(
                                    {
                                        "id": current_message_id,
                                        "role": "assistant",
                                        "parts": [{"type": "text", "text": message_buffer}],
                                        "createdAt": datetime.utcnow(),
                                        "attachments": [],
                                        "chatId": str(request.id),
                                    }
                                )
                                message_buffer = ""
                        elif event_type == "start":
                            current_message_id = data.get("messageId")

                        yield event
                    except json.JSONDecodeError:
                        # Not JSON, yield as-is
                        yield event
                else:
                    yield event

            # Save assistant messages after streaming completes
            if assistant_messages:
                await save_messages(db, assistant_messages)

            # Update chat context with usage
            if final_usage:
                try:
                    await update_chat_last_context_by_id(db, request.id, final_usage)
                except Exception as err:
                    print(f"Warning: Unable to persist last usage for chat {request.id}: {err}")

        response = StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)

    except Exception as e:
        print(f"Error in stream_chat: {e}")
        if isinstance(e, ChatSDKError):
            raise
        raise ChatSDKError("offline:chat", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
