"""
Streaming utility that adapts aisuite streaming to Vercel AI SDK format.
Based on: https://raw.githubusercontent.com/vercel-labs/ai-sdk-preview-python-streaming/main/api/utils/stream.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import traceback
import uuid
from typing import Any, Callable, Dict, Mapping, Optional, Sequence

from fastapi.responses import StreamingResponse
from openai import OpenAI
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam

from app.utils.helpers import format_sse

logger = logging.getLogger(__name__)


def chunk_text_by_words(text: str) -> list[str]:
    """
    Split text into word-by-word chunks for smoother streaming.
    This mimics the behavior of Vercel AI SDK's smoothStream({ chunking: "word" }).

    Args:
        text: The text content to chunk

    Returns:
        List of word chunks (words with trailing spaces/punctuation preserved)
    """
    if not text:
        return []

    # Split by word boundaries, preserving spaces and punctuation
    # Match words (including punctuation) and whitespace
    chunks = re.findall(r"\S+\s*|\s+", text)
    return chunks if chunks else [text]


def _process_chunk(
    chunk: Any,
    text_stream_id: str,
    tool_calls_state: Dict[int, Dict[str, Any]],
):
    """
    Process a single chunk from the stream and yield SSE events as they're created.

    This is a generator function that yields events in real-time as they're processed,
    rather than buffering them. This provides lower latency for streaming responses.

    Yields:
        SSE event strings as they're processed (text-start, text-delta, tool-input-start, etc.)

    Returns:
        Tuple of (text_started, finish_reason) via StopIteration.value (Python 3.3+)
    """
    text_started = False
    finish_reason = None

    # Check if chunk has choices (OpenAI-like format)
    if hasattr(chunk, "choices") and chunk.choices:
        for choice in chunk.choices:
            if hasattr(choice, "finish_reason") and choice.finish_reason is not None:
                finish_reason = choice.finish_reason

            delta = getattr(choice, "delta", None)
            if delta is None:
                continue

            # Handle text content
            content = getattr(delta, "content", None)
            if content is not None:
                text_stream_id = getattr(delta, "item_id", text_stream_id)
                if not text_started:
                    # Yield text-start event immediately
                    yield format_sse({"type": "text-start", "id": text_stream_id})
                    text_started = True
                # Yield text-delta event immediately
                yield format_sse({"type": "text-delta", "id": text_stream_id, "delta": content})

            # Handle tool calls
            tool_calls = getattr(delta, "tool_calls", None)
            if tool_calls:
                for tool_call_delta in tool_calls:
                    index = getattr(tool_call_delta, "index", 0)
                    state = tool_calls_state.setdefault(
                        index,
                        {
                            "id": None,
                            "name": None,
                            "arguments": "",
                            "started": False,
                        },
                    )

                    tool_call_id = getattr(tool_call_delta, "id", None)
                    if tool_call_id is not None:
                        state["id"] = tool_call_id
                        if (
                            state["id"] is not None
                            and state["name"] is not None
                            and not state["started"]
                        ):
                            # Yield tool-input-start event immediately
                            yield format_sse(
                                {
                                    "type": "tool-input-start",
                                    "toolCallId": state["id"],
                                    "toolName": state["name"],
                                }
                            )
                            state["started"] = True

                    function_call = getattr(tool_call_delta, "function", None)
                    if function_call is not None:
                        function_name = getattr(function_call, "name", None)
                        if function_name is not None:
                            state["name"] = function_name
                            if (
                                state["id"] is not None
                                and state["name"] is not None
                                and not state["started"]
                            ):
                                # Yield tool-input-start event immediately
                                yield format_sse(
                                    {
                                        "type": "tool-input-start",
                                        "toolCallId": state["id"],
                                        "toolName": state["name"],
                                    }
                                )
                                state["started"] = True

                        function_arguments = getattr(function_call, "arguments", None)
                        if function_arguments:
                            if (
                                state["id"] is not None
                                and state["name"] is not None
                                and not state["started"]
                            ):
                                # Yield tool-input-start event immediately
                                yield format_sse(
                                    {
                                        "type": "tool-input-start",
                                        "toolCallId": state["id"],
                                        "toolName": state["name"],
                                    }
                                )
                                state["started"] = True

                            state["arguments"] += function_arguments
                            if state["id"] is not None:
                                # Yield tool-input-delta event immediately
                                yield format_sse(
                                    {
                                        "type": "tool-input-delta",
                                        "toolCallId": state["id"],
                                        "inputTextDelta": function_arguments,
                                    }
                                )

    # Return state via generator return value (Python 3.3+)
    return text_started, finish_reason


async def stream_text(
    client: OpenAI,
    model: str,
    messages: Sequence[ChatCompletionMessageParam],
    system: Optional[str] = None,
    tools: Optional[Mapping[str, Callable[..., Any]]] = None,
    tool_definitions: Optional[Sequence[Dict[str, Any]]] = None,
    temperature: float = 0.7,
    max_completion_tokens: Optional[int] = None,
    max_tool_turns: int = 5,
    sse_event_callback: Optional[Callable[[str], None]] = None,
    stream_yield_delay: float = 0.01,
):
    """
    Stream text using aisuite and format as Vercel AI SDK SSE events.
    Supports multi-turn tool calling - tool results are automatically passed back to the LLM.

    Args:
        client: OpenAI client instance
        model: Model name (e.g., "openai:gpt-4o")
        messages: Chat messages in OpenAI format
        system: System prompt (optional)
        tools: Dict of callable Python functions for tools
        tool_definitions: List of tool definitions in OpenAI format (if tools not provided)
        temperature: Sampling temperature
        max_completion_tokens: Maximum completion tokens to generate
        max_tool_turns: Maximum number of tool call iterations (default: 5)

    Yields:
        SSE-formatted strings compatible with Vercel AI SDK
    """
    try:
        logger.info("=== stream_text called ===")
        logger.info("Model: %s", model)
        message_id = f"msg-{uuid.uuid4().hex}"

        # Prepare initial messages with system prompt if provided
        conversation_messages = list(messages)
        if system:
            # Insert system message at the beginning
            conversation_messages.insert(0, {"role": "system", "content": system})

        # Track cumulative usage across all turns
        total_usage_data = None

        # Multi-turn tool calling loop
        for turn in range(max_tool_turns):
            logger.info("=== Tool turn %d/%d ===", turn + 1, max_tool_turns)

            text_stream_id = "text-1"
            text_started = False
            text_finished = False
            finish_reason = None
            usage_data = None
            tool_calls_state: Dict[int, Dict[str, Any]] = {}

            # Yield start event only on first turn
            if turn == 0:
                logger.info("Yielding start event with messageId: %s", message_id)
                yield format_sse({"type": "start", "messageId": message_id})
                await asyncio.sleep(0)  # Flush immediately

            # Call OpenAI with streaming
            stream = client.chat.completions.create(
                model=model,
                messages=conversation_messages,  # Updated with tool results from previous turns
                stream=True,
                temperature=temperature,
                max_completion_tokens=max_completion_tokens,
                tools=tool_definitions if tool_definitions else None,
                store=True,
            )

            yield format_sse({"type": "start-step"})

            # Process stream chunks
            logger.info("Starting to iterate over stream chunks...")
            chunk_count = 0
            try:
                # Iterate over stream chunks - OpenAI SDK stream is synchronous
                # but we yield immediately to prevent buffering
                for chunk in stream:
                    # Give event loop a chance to process after each chunk
                    # This prevents blocking and allows immediate flushing
                    await asyncio.sleep(stream_yield_delay)
                    chunk_count += 1
                    if chunk_count == 1:
                        logger.info("First chunk received in turn %d", turn + 1)
                    text_stream_id = chunk.id

                    # Check if chunk has choices (OpenAI-like format)
                    if hasattr(chunk, "choices") and chunk.choices:
                        for choice in chunk.choices:
                            if (
                                hasattr(choice, "finish_reason")
                                and choice.finish_reason is not None
                            ):
                                finish_reason = choice.finish_reason

                            delta = getattr(choice, "delta", None)
                            if delta is None:
                                continue

                            # Handle text content
                            content = getattr(delta, "content", None)
                            if content is not None:
                                if not text_started:
                                    # Yield text-start event immediately (only once)
                                    yield format_sse({"type": "text-start", "id": text_stream_id})
                                    text_started = True
                                # Chunk content word-by-word for smoother streaming
                                # This mimics Vercel AI SDK's smoothStream({ chunking: "word" })
                                word_chunks = chunk_text_by_words(content)
                                for word_chunk in word_chunks:
                                    # Yield each word chunk as a separate text-delta event
                                    yield format_sse(
                                        {
                                            "type": "text-delta",
                                            "id": text_stream_id,
                                            "delta": word_chunk,
                                        }
                                    )
                                    # Give event loop a chance to flush immediately
                                    await asyncio.sleep(stream_yield_delay)

                            # Handle tool calls
                            tool_calls = getattr(delta, "tool_calls", None)
                            if tool_calls:
                                for tool_call_delta in tool_calls:
                                    index = getattr(tool_call_delta, "index", 0)
                                    state = tool_calls_state.setdefault(
                                        index,
                                        {
                                            "id": None,
                                            "name": None,
                                            "arguments": "",
                                            "started": False,
                                        },
                                    )

                                    tool_call_id = getattr(tool_call_delta, "id", None)
                                    if tool_call_id is not None:
                                        state["id"] = tool_call_id
                                        if (
                                            state["id"] is not None
                                            and state["name"] is not None
                                            and not state["started"]
                                        ):
                                            # Yield tool-input-start event immediately
                                            yield format_sse(
                                                {
                                                    "type": "tool-input-start",
                                                    "toolCallId": state["id"],
                                                    "toolName": state["name"],
                                                }
                                            )
                                            state["started"] = True

                                    function_call = getattr(tool_call_delta, "function", None)
                                    if function_call is not None:
                                        function_name = getattr(function_call, "name", None)
                                        if function_name is not None:
                                            state["name"] = function_name
                                            if (
                                                state["id"] is not None
                                                and state["name"] is not None
                                                and not state["started"]
                                            ):
                                                # Yield tool-input-start event immediately
                                                yield format_sse(
                                                    {
                                                        "type": "tool-input-start",
                                                        "toolCallId": state["id"],
                                                        "toolName": state["name"],
                                                    }
                                                )
                                                state["started"] = True

                                        function_arguments = getattr(
                                            function_call, "arguments", None
                                        )
                                        if function_arguments:
                                            if (
                                                state["id"] is not None
                                                and state["name"] is not None
                                                and not state["started"]
                                            ):
                                                # Yield tool-input-start event immediately
                                                yield format_sse(
                                                    {
                                                        "type": "tool-input-start",
                                                        "toolCallId": state["id"],
                                                        "toolName": state["name"],
                                                    }
                                                )
                                                state["started"] = True

                                            state["arguments"] += function_arguments
                                            if state["id"] is not None:
                                                # Yield tool-input-delta event immediately
                                                yield format_sse(
                                                    {
                                                        "type": "tool-input-delta",
                                                        "toolCallId": state["id"],
                                                        "inputTextDelta": function_arguments,
                                                    }
                                                )

                    # Check for usage data
                    if hasattr(chunk, "usage") and chunk.usage is not None:
                        usage_data = chunk.usage
                        # Accumulate usage across turns
                        if total_usage_data is None:
                            # Initialize with first usage data
                            total_usage_data = {
                                "prompt_tokens": getattr(usage_data, "prompt_tokens", 0),
                                "completion_tokens": getattr(usage_data, "completion_tokens", 0),
                                "total_tokens": getattr(usage_data, "total_tokens", 0),
                            }
                        else:
                            # Accumulate tokens
                            total_usage_data["prompt_tokens"] += getattr(
                                usage_data, "prompt_tokens", 0
                            )
                            total_usage_data["completion_tokens"] += getattr(
                                usage_data, "completion_tokens", 0
                            )
                            total_usage_data["total_tokens"] += getattr(
                                usage_data, "total_tokens", 0
                            )

            except Exception as stream_error:
                # If stream iteration fails, log and continue to finish events
                logger.error("Stream iteration failed: %s", stream_error, exc_info=True)
                # Don't re-raise - we'll still send finish events

            # Handle text end - emit if text was started and stream finished
            if finish_reason == "stop" and text_started and not text_finished:
                yield format_sse({"type": "text-end", "id": text_stream_id})
                text_finished = True

            # Handle tool calls completion
            if finish_reason == "tool_calls" and tools:
                logger.info("Tool calls detected, executing tools...")

                # First, add the assistant message with tool calls to conversation
                assistant_tool_calls = []
                for index in sorted(tool_calls_state.keys()):
                    state = tool_calls_state[index]
                    if state.get("id") and state.get("name"):
                        assistant_tool_calls.append(
                            {
                                "id": state["id"],
                                "type": "function",
                                "function": {
                                    "name": state["name"],
                                    "arguments": state["arguments"],
                                },
                            }
                        )

                if assistant_tool_calls:
                    # Add assistant message with tool calls
                    conversation_messages.append(
                        {
                            "role": "assistant",
                            "tool_calls": assistant_tool_calls,
                        }
                    )

                # Now execute tools and collect results
                tool_messages = []

                for index in sorted(tool_calls_state.keys()):
                    state = tool_calls_state[index]
                    tool_call_id = state.get("id")
                    tool_name = state.get("name")

                    if tool_call_id is None or tool_name is None:
                        continue

                    if not state["started"]:
                        yield format_sse(
                            {
                                "type": "tool-input-start",
                                "toolCallId": tool_call_id,
                                "toolName": tool_name,
                            }
                        )
                        state["started"] = True

                    raw_arguments = state["arguments"]
                    try:
                        parsed_arguments = json.loads(raw_arguments) if raw_arguments else {}
                    except Exception as error:
                        yield format_sse(
                            {
                                "type": "tool-input-error",
                                "toolCallId": tool_call_id,
                                "toolName": tool_name,
                                "input": raw_arguments,
                                "errorText": str(error),
                            }
                        )
                        # Add error as tool message
                        tool_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call_id,
                                "content": json.dumps({"error": str(error)}),
                            }
                        )
                        continue

                    yield format_sse(
                        {
                            "type": "tool-input-available",
                            "toolCallId": tool_call_id,
                            "toolName": tool_name,
                            "input": parsed_arguments,
                        }
                    )

                    # Execute tool
                    tool_function = tools.get(tool_name)
                    if tool_function is None:
                        error_msg = f"Tool '{tool_name}' not found."
                        yield format_sse(
                            {
                                "type": "tool-output-error",
                                "toolCallId": tool_call_id,
                                "errorText": error_msg,
                            }
                        )
                        tool_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call_id,
                                "content": json.dumps({"error": error_msg}),
                            }
                        )
                        continue

                    # Create SSE writer for tool execution
                    tool_sse_events = []

                    def tool_sse_writer(event: str):
                        """Collect SSE events emitted by tools."""
                        tool_sse_events.append(event)

                    # Execute tool (async)
                    try:
                        # Try to call with _sse_writer parameter (tools that support it)
                        tool_result = await tool_function(
                            **parsed_arguments,
                            _sse_writer=tool_sse_writer,
                        )
                    except TypeError as e:
                        # Tool doesn't accept _sse_writer parameter, call without it
                        if "_sse_writer" in str(e) or "unexpected keyword" in str(e).lower():
                            try:
                                tool_result = await tool_function(**parsed_arguments)
                            except Exception as error:
                                error_msg = str(error)
                                yield format_sse(
                                    {
                                        "type": "tool-output-error",
                                        "toolCallId": tool_call_id,
                                        "toolName": tool_name,
                                        "errorText": error_msg,
                                    }
                                )
                                tool_messages.append(
                                    {
                                        "role": "tool",
                                        "tool_call_id": tool_call_id,
                                        "content": json.dumps({"error": error_msg}),
                                    }
                                )
                                continue
                        else:
                            raise
                    except Exception as error:
                        error_msg = str(error)
                        yield format_sse(
                            {
                                "type": "tool-output-error",
                                "toolCallId": tool_call_id,
                                "toolName": tool_name,
                                "errorText": error_msg,
                            }
                        )
                        tool_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call_id,
                                "content": json.dumps({"error": error_msg}),
                            }
                        )
                        continue

                    # Yield any SSE events emitted by the tool
                    for event in tool_sse_events:
                        yield event

                    # Yield tool result
                    yield format_sse(
                        {
                            "type": "tool-output-available",
                            "toolCallId": tool_call_id,
                            "output": tool_result,
                        }
                    )

                    # Add tool result to conversation messages
                    # Tool results must be JSON strings
                    tool_result_str = (
                        json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
                    )
                    tool_messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call_id,
                            "content": tool_result_str,
                        }
                    )

                # Add tool results to conversation for next turn
                if tool_messages:
                    logger.info(
                        "Adding %d tool result(s) to conversation for next turn", len(tool_messages)
                    )
                    conversation_messages.extend(tool_messages)
                    # Continue loop to make another API call
                    continue
            else:
                # No tool calls or no tools provided - we're done
                if text_started and not text_finished:
                    yield format_sse({"type": "text-end", "id": text_stream_id})
                    text_finished = True
                break

        # Finish metadata
        finish_metadata: Dict[str, Any] = {}
        if finish_reason is not None:
            finish_metadata["finishReason"] = finish_reason.replace("_", "-")

        # Use accumulated usage data
        if total_usage_data is not None:
            usage_payload = {
                "promptTokens": total_usage_data.get("prompt_tokens", 0),
                "completionTokens": total_usage_data.get("completion_tokens", 0),
            }
            total_tokens = total_usage_data.get("total_tokens")
            if total_tokens is not None:
                usage_payload["totalTokens"] = total_tokens
            finish_metadata["usage"] = usage_payload
        elif usage_data is not None:
            usage_payload = {
                "promptTokens": getattr(usage_data, "prompt_tokens", 0),
                "completionTokens": getattr(usage_data, "completion_tokens", 0),
            }
            total_tokens = getattr(usage_data, "total_tokens", None)
            if total_tokens is not None:
                usage_payload["totalTokens"] = total_tokens
            finish_metadata["usage"] = usage_payload

        if finish_metadata:
            yield format_sse({"type": "finish", "messageMetadata": finish_metadata})
        else:
            yield format_sse({"type": "finish"})

        yield "data: [DONE]\n\n"
    except Exception:
        logger.error("Error in stream_text", exc_info=True)
        stack_trace = traceback.format_exc()
        yield format_sse({"type": "error", "error": f"Error in stream_text: {stack_trace}"})
        yield "data: [DONE]\n\n"


def patch_response_with_headers(
    response: StreamingResponse,
    protocol: str = "data",
) -> StreamingResponse:
    """Apply the standard streaming headers expected by the Vercel AI SDK."""

    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"

    if protocol:
        response.headers.setdefault("x-vercel-ai-protocol", protocol)

    return response
