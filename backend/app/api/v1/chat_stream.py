"""
Chat streaming endpoint using aisuite + OpenAI.
This endpoint handles AI streaming and replaces the Next.js /api/chat/stream endpoint.
"""

import asyncio
import json
import logging
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_ai_client, get_model_name
from app.ai.mcp_tools.data360_mcp import get_mcp_tools
from app.ai.tools import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    GET_WEATHER_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    get_weather,
    request_suggestions_tool,
    update_document_tool,
)
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import (
    save_messages,
    update_chat_last_context_by_id,
)
from app.utils.stream import patch_response_with_headers, stream_text
from app.utils.user_id import get_user_id_uuid

logger = logging.getLogger(__name__)

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


# ruff: noqa: N815
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

        # 1. Get existing messages from request body
        messages_from_db = request.existingMessages

        # 2. Convert messages to OpenAI format
        # Combine existing messages with the new user message
        all_messages = []
        for msg in messages_from_db:
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

        # Convert to OpenAI format
        openai_messages = convert_messages_to_openai_format(all_messages)

        # 3. Get system prompt
        # TODO: Get geolocation hints from request headers or frontend
        request_hints = None  # Will be implemented later
        system = get_system_prompt(request.selectedChatModel, request_hints)

        # 4. Get AI client and model
        client = get_ai_client()
        model = get_model_name(request.selectedChatModel)

        # 5. Prepare tools
        # Create tool definitions and callable functions
        tool_definitions = [
            GET_WEATHER_TOOL_DEFINITION,
            CREATE_DOCUMENT_TOOL_DEFINITION,
            UPDATE_DOCUMENT_TOOL_DEFINITION,
            # REQUEST_SUGGESTIONS_TOOL_DEFINITION,
        ]

        # Create tools dict with async wrappers
        # These will receive _sse_writer parameter from stream_text
        async def get_weather_wrapper(**kwargs):
            # Remove _sse_writer if present (weather doesn't need it)
            kwargs.pop("_sse_writer", None)
            return await get_weather(**kwargs)

        async def create_document_wrapper(**kwargs):
            sse_writer = kwargs.pop("_sse_writer", None)
            return await create_document_tool(
                title=kwargs["title"],
                kind=kwargs["kind"],
                user_id=str(user_id),
                db_session=db,
                sse_writer=sse_writer,
            )

        async def update_document_wrapper(**kwargs):
            sse_writer = kwargs.pop("_sse_writer", None)
            return await update_document_tool(
                document_id=kwargs["id"],
                description=kwargs["description"],
                user_id=str(user_id),
                db_session=db,
                sse_writer=sse_writer,
            )

        async def request_suggestions_wrapper(**kwargs):
            sse_writer = kwargs.pop("_sse_writer", None)
            return await request_suggestions_tool(
                document_id=kwargs["documentId"],
                user_id=str(user_id),
                db_session=db,
                sse_writer=sse_writer,
            )

        tools = {
            "getWeather": {
                "function": get_weather_wrapper,
                "type": "tool",
            },
            "createDocument": {
                "function": create_document_wrapper,
                "type": "tool",
            },
            "updateDocument": {
                "function": update_document_wrapper,
                "type": "tool",
            },
            # "requestSuggestions": request_suggestions_wrapper,
        }

        # Add MCP tools
        mcp_tools = await get_mcp_tools()

        for tool in mcp_tools:
            tools[tool["function"]["name"]] = {
                "function": None,
                "type": "mcp",
            }
            tool_definitions.append(tool)

        logger.info("tool_definitions: %s", tool_definitions)

        # Track usage and messages for saving
        final_usage: Optional[Dict[str, Any]] = None
        assistant_messages: List[Dict[str, Any]] = []

        async def stream_generator():
            nonlocal final_usage, assistant_messages
            # Capture background_tasks in closure so we can use it in finally block
            nonlocal background_tasks

            logger.info("=== STREAM GENERATOR STARTED ===")
            # message_buffer = ""
            current_message_id: Optional[str] = None
            current_part = {}
            message_parts_buffer = []
            # tools_buffer = []

            try:
                logger.info("Starting stream_text iteration...")
                async for event in stream_text(
                    client=client,
                    model=model,
                    messages=openai_messages,
                    system=system,
                    tools=tools,
                    tool_definitions=tool_definitions,
                    temperature=0.7,
                    max_tool_turns=5,
                ):
                    # Convert string to bytes for FastAPI StreamingResponse
                    if isinstance(event, str):
                        event_bytes = event.encode("utf-8")
                    else:
                        event_bytes = event

                    # Parse SSE event to extract data (only if it's a string)
                    if isinstance(event, str) and event.startswith("data: "):
                        data_str = event[6:].strip()
                        if data_str == "[DONE]":
                            yield event_bytes
                            # Give event loop a chance to flush
                            await asyncio.sleep(0)
                            break

                        try:
                            data = json.loads(data_str)
                            event_type = data.get("type")

                            if event_type == "start":
                                current_message_id = str(uuid4())

                            elif event_type == "start-step":
                                message_parts_buffer.append({"type": "step-start"})

                            elif event_type == "text-start":
                                current_part = {
                                    "type": "text",
                                    "text": "",
                                    "state": "",
                                    "providerMetadata": {"openai": {"itemId": data.get("id")}},
                                }
                            # Track text deltas for message saving

                            elif event_type == "text-delta":
                                # message_buffer += data.get("delta", "")
                                current_part["text"] += data.get("delta", "")

                            elif event_type == "text-end":
                                # Save accumulated message when text ends
                                if current_part and current_message_id:
                                    # assistant_messages.append(
                                    #     {
                                    #         "id": current_message_id,
                                    #         "role": "assistant",
                                    #         "parts": [{"type": "text", "text": message_buffer}],
                                    #         "createdAt": datetime.utcnow(),
                                    #         "attachments": [],
                                    #         "chatId": str(request.id),
                                    #     }
                                    # )
                                    # message_buffer = ""
                                    current_part["state"] = "done"
                                    message_parts_buffer.append(current_part)
                                    current_part = {}

                            elif event_type == "tool-input-start":
                                current_part = {
                                    "type": "tool-" + data.get("toolName", ""),
                                    "toolCallId": data.get("toolCallId"),
                                    "state": "",
                                    "input": {},
                                    "output": {},
                                    "callProviderMetadata": {
                                        "openai": {"itemId": data.get("toolCallId")}
                                    },
                                }

                            elif event_type == "tool-input-error":
                                current_part["state"] = "input-available"
                                current_part["input"]["error"] = data["errorText"]
                                message_parts_buffer.append(current_part)

                                current_part = {}

                            elif event_type == "tool-input-available":
                                current_part["input"] = data["input"]
                                current_part["state"] = "input-available"
                                # Don't save yet because this will be done in either `tool-output-error` or `tool-output-available`.

                            elif event_type == "tool-output-error":
                                current_part["state"] = "output-available"
                                current_part["output"]["error"] = data["errorText"]
                                message_parts_buffer.append(current_part)

                                current_part = {}

                            elif event_type == "tool-output-available":
                                current_part["output"] = data["output"]
                                current_part["state"] = "output-available"
                                message_parts_buffer.append(current_part)

                                current_part = {}

                            elif event_type == "finish":
                                if message_parts_buffer and current_message_id:
                                    # Check if we haven't already saved this message

                                    assistant_messages.append(
                                        {
                                            "id": current_message_id,
                                            "role": "assistant",
                                            "parts": message_parts_buffer,
                                            "createdAt": datetime.utcnow(),
                                            "attachments": [],
                                            "chatId": str(request.id),
                                        }
                                    )

                                # Track usage
                                metadata = data.get("messageMetadata", {})
                                usage = metadata.get("usage")
                                if usage:
                                    final_usage = usage

                            yield event_bytes
                            # Give event loop a chance to flush immediately
                            await asyncio.sleep(0)
                        except json.JSONDecodeError:
                            # Not JSON, yield as-is
                            yield event_bytes
                            await asyncio.sleep(0)
                    else:
                        yield event_bytes
                        await asyncio.sleep(0)

                # Final fallback: Save any remaining message content
                # This handles cases where the stream ended without text-end or finish events

                logger.info(
                    f"=== STREAM GENERATOR ENDED with assistant messages: {len(assistant_messages)} message(s) ==="
                )

                logger.info("assistant messages to save: %s", assistant_messages)

            except GeneratorExit:
                # Generator is being closed by client, re-raise to allow cleanup
                raise
            except Exception as stream_error:
                # Log the error and send error event, then ensure stream closes properly
                error_msg = f"Error in stream: {str(stream_error)}"
                logger.error("Error in stream: %s", error_msg, exc_info=True)
                try:
                    yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n".encode(
                        "utf-8"
                    )
                    yield f"data: {json.dumps({'type': 'finish'})}"
                    yield "data: [DONE]\n\n".encode("utf-8")
                except Exception:
                    # If we can't yield, connection is likely closed
                    pass
            finally:
                # Schedule background tasks AFTER stream completes
                # This ensures assistant_messages and final_usage are populated
                if assistant_messages:
                    logger.info(
                        f"DEBUG: Scheduling save of {len(assistant_messages)} assistant message(s) for chat {request.id}"
                    )
                    # Create a copy of the list for the background task
                    messages_copy = assistant_messages.copy()
                    # Get a fresh database session for the background task
                    # Note: We need to create a new session since the original db session
                    # might be closed when the background task runs
                    from app.core.database import AsyncSessionLocal

                    async def save_messages_task():
                        async with AsyncSessionLocal() as session:
                            await save_messages(session, messages_copy)

                    background_tasks.add_task(save_messages_task)
                else:
                    logger.warning("No assistant messages to save for chat %s", request.id)

                if final_usage:
                    from app.core.database import AsyncSessionLocal

                    async def update_context_task():
                        async with AsyncSessionLocal() as session:
                            await update_chat_last_context_by_id(session, request.id, final_usage)

                    background_tasks.add_task(update_context_task)

        response = StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
        )
        return patch_response_with_headers(response)
        # return response

    except Exception as e:
        stack_trace = traceback.format_exc()
        if isinstance(e, ChatSDKError):
            raise
        raise ChatSDKError(
            "offline:chat",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in stream_chat: {e}\n{stack_trace} - {msg}",
        )
