"""
Convert OpenAI response events to Vercel AI SDK data stream protocol format.

This module handles the conversion of OpenAI response streaming events
(ResponseCreatedEvent, ResponseTextDeltaEvent, etc.) to the Vercel AI SDK
SSE format used by the frontend.
"""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any, AsyncGenerator, Callable, Dict, Mapping, Optional, Sequence
from openai._models import BaseModel
from openai import AsyncOpenAI
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from openai.types.responses import (
    ResponseCompletedEvent,
    ResponseContentPartAddedEvent,
    ResponseContentPartDoneEvent,
    ResponseCreatedEvent,
    ResponseInProgressEvent,
    ResponseMcpCallArgumentsDeltaEvent,
    ResponseMcpCallArgumentsDoneEvent,
    ResponseMcpCallCompletedEvent,
    ResponseMcpCallFailedEvent,
    ResponseMcpCallInProgressEvent,
    ResponseOutputItemAddedEvent,
    ResponseOutputItemDoneEvent,
    ResponseTextDeltaEvent,
    ResponseTextDoneEvent,
)  # noqa: E501

from app.utils.helpers import format_sse, get_date_string, sse_frame, to_jsonable

logger = logging.getLogger(__name__)


def handle_response_event(event: BaseModel, message_id: Optional[str] = None) -> Optional[str]:
    """
    Convert an OpenAI response event to Vercel AI SDK SSE format.

    Args:
        event: OpenAI response event (BaseModel subclass)
        message_id: Optional message ID for tracking (generated if not provided)

    Returns:
        SSE-formatted string or None if event should be ignored
    """
    if message_id is None:
        message_id = f"msg-{uuid.uuid4().hex}"

    # Route to appropriate handler
    if isinstance(event, ResponseCreatedEvent):
        return handle_response_created_event(event, message_id)
    elif isinstance(event, ResponseInProgressEvent):
        return handle_response_in_progress_event(event)
    elif isinstance(event, ResponseCompletedEvent):
        return handle_response_completed_event(event)
    elif isinstance(event, ResponseTextDeltaEvent):
        return handle_response_text_delta_event(event)
    elif isinstance(event, ResponseTextDoneEvent):
        return handle_response_text_done_event(event)
    elif isinstance(event, ResponseOutputItemAddedEvent):
        return handle_response_output_item_added_event(event)
    elif isinstance(event, ResponseOutputItemDoneEvent):
        return handle_response_output_item_done_event(event)
    elif isinstance(event, ResponseMcpCallInProgressEvent):
        return handle_response_mcp_call_in_progress_event(event)
    elif isinstance(event, ResponseMcpCallArgumentsDeltaEvent):
        # Arguments delta is handled by arguments_done event
        return None
    elif isinstance(event, ResponseMcpCallArgumentsDoneEvent):
        return handle_response_mcp_call_arguments_done_event(event)
    elif isinstance(event, ResponseMcpCallCompletedEvent):
        # Completion is handled by output_item_done event
        return None
    elif isinstance(event, ResponseMcpCallFailedEvent):
        # Failure is handled by output_item_done event
        return None
    elif isinstance(event, ResponseContentPartAddedEvent):
        # Content part added is handled by other events
        return None
    elif isinstance(event, ResponseContentPartDoneEvent):
        # Content part done is handled by output_item_done event
        return None
    else:
        logger.warning(f"Unknown event type: {type(event)} - {event.model_dump_json()}")
        return None


def handle_response_created_event(event: ResponseCreatedEvent, message_id: str) -> str:
    """
    Handle ResponseCreatedEvent - maps to 'start' event in Vercel AI SDK format.
    """
    return format_sse({"type": "start", "messageId": message_id})


def handle_response_in_progress_event(event: ResponseInProgressEvent) -> Optional[str]:
    """
    Handle ResponseInProgressEvent - can be ignored or used for status updates.
    """
    # In Vercel AI SDK format, we don't have a specific "in_progress" event
    # The start event already indicates streaming has begun
    return None


def handle_response_text_delta_event(event: ResponseTextDeltaEvent) -> Optional[str]:
    """
    Handle ResponseTextDeltaEvent - maps to 'text-delta' event in Vercel AI SDK format.
    """
    # Get text stream ID from event, default to "text-1"
    text_stream_id = getattr(event, "item_id", "text-1")

    # Check if this is the first delta (need to emit text-start)
    # Note: We can't track state here, so the caller should handle text-start separately
    # For now, we'll just emit the delta and let the caller manage text-start

    return format_sse(
        {
            "type": "text-delta",
            "id": text_stream_id,
            "delta": event.delta,
        }
    )


def handle_response_text_done_event(event: ResponseTextDoneEvent) -> str:
    """
    Handle ResponseTextDoneEvent - maps to 'text-end' event in Vercel AI SDK format.
    """
    text_stream_id = getattr(event, "item_id", "text-1")

    return format_sse(
        {
            "type": "text-end",
            "id": text_stream_id,
        }
    )


def handle_response_output_item_added_event(event: ResponseOutputItemAddedEvent) -> Optional[str]:
    """
    Handle ResponseOutputItemAddedEvent - maps to tool or message start events.
    """
    if event.item.type == "mcp_call":
        # Tool call started - map to tool-input-start
        tool_call_id = getattr(event.item, "id", None)
        tool_name = getattr(event.item, "name", None)

        if tool_call_id and tool_name:
            return format_sse(
                {
                    "type": "tool-input-start",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name,
                }
            )
    elif event.item.type == "message":
        # Message item added - this is typically handled by text-start
        # which is emitted when first text-delta arrives
        return None

    logger.warning(f"Unknown output item type: {event.item.type}")
    return None


def handle_response_mcp_call_in_progress_event(
    event: ResponseMcpCallInProgressEvent,
) -> Optional[str]:
    """
    Handle ResponseMcpCallInProgressEvent - tool call in progress.
    """
    # In Vercel AI SDK format, tool-input-start already indicates the tool is starting
    # We don't need a separate "in_progress" event
    return None


def handle_response_mcp_call_arguments_done_event(
    event: ResponseMcpCallArgumentsDoneEvent,
) -> Optional[str]:
    """
    Handle ResponseMcpCallArgumentsDoneEvent - maps to 'tool-input-available' event.
    """
    # Extract tool call ID and arguments
    tool_call_id = getattr(event, "call_id", None)
    tool_name = getattr(event, "name", None)
    arguments = event.arguments

    if not tool_call_id:
        logger.warning("Missing tool_call_id in ResponseMcpCallArgumentsDoneEvent")
        return None

    # Convert arguments to JSON-serializable format
    try:
        parsed_arguments = to_jsonable(arguments) if arguments else {}
    except Exception as e:
        logger.error(f"Error parsing tool arguments: {e}")
        return format_sse(
            {
                "type": "tool-input-error",
                "toolCallId": tool_call_id,
                "toolName": tool_name or "unknown",
                "input": str(arguments) if arguments else "",
                "errorText": str(e),
            }
        )

    return format_sse(
        {
            "type": "tool-input-available",
            "toolCallId": tool_call_id,
            "toolName": tool_name or "unknown",
            "input": parsed_arguments,
        }
    )


def handle_response_output_item_done_event(event: ResponseOutputItemDoneEvent) -> Optional[str]:
    """
    Handle ResponseOutputItemDoneEvent - maps to tool output or message completion.
    """
    if event.item.type == "mcp_call":
        # Tool call completed - map to tool-output-available or tool-output-error
        tool_call_id = getattr(event.item, "id", None)
        tool_name = getattr(event.item, "name", None)
        error = getattr(event.item, "error", None)
        output = getattr(event.item, "output", None)
        arguments = getattr(event.item, "arguments", None)

        if not tool_call_id:
            logger.warning("Missing tool_call_id in ResponseOutputItemDoneEvent")
            return None

        # Convert to JSON-serializable format
        if arguments:
            try:
                arguments = to_jsonable(arguments)
            except Exception as e:
                logger.warning(f"Error converting tool arguments: {e}")
                arguments = str(arguments)

        if error:
            # Tool call failed
            error_text = (
                json.dumps(error, indent=2, ensure_ascii=False)
                if isinstance(error, dict)
                else str(error)
            )
            return format_sse(
                {
                    "type": "tool-output-error",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name or "unknown",
                    "errorText": error_text,
                }
            )
        else:
            # Tool call succeeded
            if output and isinstance(output, str):
                try:
                    output = to_jsonable(output)
                except Exception:
                    output = str(output)

            return format_sse(
                {
                    "type": "tool-output-available",
                    "toolCallId": tool_call_id,
                    "output": output,
                }
            )
    elif event.item.type == "message":
        # Message completed - this is typically handled by text-end
        # which is emitted by ResponseTextDoneEvent
        return None

    logger.warning(f"Unknown output item type in done event: {event.item.type}")
    return None


def handle_response_completed_event(event: ResponseCompletedEvent) -> str:
    """
    Handle ResponseCompletedEvent - maps to 'finish' event in Vercel AI SDK format.
    """
    finish_metadata: Dict[str, Any] = {}

    # Extract response ID if available
    if hasattr(event, "response") and hasattr(event.response, "id"):
        finish_metadata["responseId"] = event.response.id

    # Extract usage information if available
    if hasattr(event, "response") and hasattr(event.response, "usage"):
        usage = event.response.usage
        if usage:
            usage_payload = {
                "promptTokens": getattr(usage, "prompt_tokens", 0),
                "completionTokens": getattr(usage, "completion_tokens", 0),
            }
            total_tokens = getattr(usage, "total_tokens", None)
            if total_tokens is not None:
                usage_payload["totalTokens"] = total_tokens
            finish_metadata["usage"] = usage_payload

    # Extract finish reason if available
    if hasattr(event, "response") and hasattr(event.response, "finish_reason"):
        finish_reason = event.response.finish_reason
        if finish_reason:
            finish_metadata["finishReason"] = finish_reason.replace("_", "-")

    if finish_metadata:
        return format_sse(
            {
                "type": "finish",
                "messageMetadata": finish_metadata,
            }
        )
    else:
        return format_sse({"type": "finish"})


async def stream_responses(
    client: AsyncOpenAI,
    model: str,
    messages: Sequence[ChatCompletionMessageParam],
    system: Optional[str] = None,
    tools: Optional[Mapping[str, Callable[..., Any]]] = None,
    tool_definitions: Optional[Sequence[Dict[str, Any]]] = None,
    temperature: float = 0.7,
    max_completion_tokens: Optional[int] = None,
    sse_event_callback: Optional[Callable[[str], None]] = None,
) -> AsyncGenerator[bytes, None]:
    """
    Streams SSE frames (bytes) with the model output.
    Emits events:
        - "response_id": { "response_id": "<id>" }
        - "delta": { "text": "<partial>" } for streaming text
        - "mcp_call": { "name": "<tool_name>" }
        - "mcp_args": { "name": "<tool_name>", "arguments": <json|string> }
        - "mcp_result": { "name": "<tool_name>", "output": "<string>" }
        - "done": { "status": "ok" }
        - "error": { "message": "<msg>" }

    Parameters:
        - input: user text input
        - history: optional list of prior messages {"role": "...", "content": "..."} (system|user|assistant)
        - previous_response_id: if continuing a threaded conversation stored on OpenAI
        - extra_instructions: appended to system prompt (if provided)
        - request_id: optional SSE id to attach to frames
    """
    system_prompt = system or f"You are a helpful assistant. Today is {get_date_string()}."

    # OpenAI Responses API call (stream=True gives a server-sent stream of events)
    async with client.responses.stream(
        model=model,
        messages=messages,
        instructions=system_prompt,
        tools=tools if tools else None,
        # stream=True,
        # If you prefer including history as 'messages', you can switch to 'messages' param in newer APIs.
    ) as response_stream:
        # tool_in_flight = None  # track MCP call name
        # indicator_codes = []
        try:
            async for event in response_stream:
                # Handle events

                output = handle_response_event(event)
                if output:
                    # if output["event"] == "mcp_result":
                    #     indicator_codes.append(output["data"]["output"])
                    yield output.encode("utf-8")
                    # frame = sse_frame(
                    #     event=output["event"],
                    #     data=output["data"],
                    #     id=request_id,
                    # )
                    # yield frame.encode("utf-8")

                # if isinstance(event, ResponseCompletedEvent):
                #     # Tell client the Response ID so they can continue threads later
                #     frame = sse_frame(
                #         event="response_id",
                #         data={"response_id": event.response.id},
                #         id=request_id,
                #     )
                #     yield frame.encode("utf-8")

                # elif isinstance(event, ResponseOutputItemAddedEvent):
                #     # Tool call started?
                #     if event.item.type == "mcp_call":
                #         tool_in_flight = event.item.name or "mcp_call"
                #         frame = sse_frame(
                #             event="mcp_call",
                #             data={"name": tool_in_flight},
                #             id=request_id,
                #         )
                #         yield frame.encode("utf-8")

                # elif isinstance(event, ResponseAudioDeltaEvent):
                #     # In the Responses API, the MCP tool arguments often arrive via 'response.mcp_call_arguments.done'
                #     if event.type == "response.mcp_call_arguments.done":
                #         args_payload = event.arguments
                #         # Try to pretty-format JSON if it's valid
                #         try:
                #             parsed = json.loads(args_payload)
                #             args_payload = parsed
                #         except Exception:
                #             # keep original string
                #             pass

                #         frame = sse_frame(
                #             event="mcp_args",
                #             data={
                #                 "name": tool_in_flight or "mcp_call",
                #                 "arguments": args_payload,
                #             },
                #             id=request_id,
                #         )
                #         yield frame.encode("utf-8")

                # elif isinstance(event, ResponseOutputItemDoneEvent):
                #     if event.item.type == "mcp_call":
                #         # Emit the raw tool result
                #         result_content = event.item.output or ""
                #         # Some servers prefix "root=", normalize if so
                #         if isinstance(
                #             result_content, str
                #         ) and result_content.startswith("root="):
                #             result_content = result_content[5:]
                #             # attempt to pretty print safely if it's Python-literal-like
                #             try:
                #                 import ast

                #                 maybe = ast.literal_eval(result_content)
                #                 result_content = json.dumps(
                #                     maybe, indent=2, ensure_ascii=False
                #                 )
                #             except Exception:
                #                 pass

                #         frame = sse_frame(
                #             event="mcp_result",
                #             data={
                #                 "name": tool_in_flight or "mcp_call",
                #                 "output": result_content,
                #             },
                #             id=request_id,
                #         )
                #         yield frame.encode("utf-8")
                #         tool_in_flight = None

                # elif isinstance(event, ResponseContentPartDoneEvent):
                #     # A content part is closed; when streaming text, you'll also see deltas separately
                #     # We mark the end of a segment with an empty delta
                #     frame = sse_frame(
                #         event="delta",
                #         data={"text": ""},
                #         id=request_id,
                #     )
                #     yield frame.encode("utf-8")

                # elif isinstance(event, ResponseTextDeltaEvent):
                #     # This is the primary token stream
                #     if event.delta:
                #         frame = sse_frame(
                #             event="delta",
                #             data={"text": event.delta},
                #             id=request_id,
                #         )
                #         yield frame.encode("utf-8")

            yield "data: [DONE]\n\n".encode("utf-8")
            # End of stream
            # frame = sse_frame(event=EventName.DONE, data={"status": "ok"}, id=request_id)
            # yield frame.encode("utf-8")

        except Exception as e:
            yield format_sse({"type": "error", "error": f"{type(e).__name__}: {str(e)}"}).encode(
                "utf-8"
            )
            # Also finish the SSE stream cleanly
            yield "data: [DONE]\n\n".encode("utf-8")
            # frame = sse_frame(event=EventName.DONE, data={"status": "error"}, id=request_id)
            # yield frame.encode("utf-8")
