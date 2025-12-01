"""
Streaming utility that adapts aisuite streaming to Vercel AI SDK format.
Based on: https://raw.githubusercontent.com/vercel-labs/ai-sdk-preview-python-streaming/main/api/utils/stream.py
"""

from __future__ import annotations

import json
import traceback
import uuid
from typing import Any, Callable, Dict, List, Mapping, Optional, Sequence, Tuple

from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam


def format_sse(payload: dict) -> str:
    """Format a payload as Server-Sent Event."""
    return f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"


def _process_chunk(
    chunk: Any,
    text_stream_id: str,
    tool_calls_state: Dict[int, Dict[str, Any]],
) -> Tuple[List[str], bool, Optional[str]]:
    """
    Process a single chunk from the stream and yield SSE events.

    Returns:
        Tuple of (events, text_started, finish_reason)
    """
    events = []
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
                events.append(format_sse({"type": "text-start", "id": text_stream_id}))
                text_started = True
                events.append(
                    format_sse({"type": "text-delta", "id": text_stream_id, "delta": content})
                )

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
                            events.append(
                                format_sse(
                                    {
                                        "type": "tool-input-start",
                                        "toolCallId": state["id"],
                                        "toolName": state["name"],
                                    }
                                )
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
                                events.append(
                                    format_sse(
                                        {
                                            "type": "tool-input-start",
                                            "toolCallId": state["id"],
                                            "toolName": state["name"],
                                        }
                                    )
                                )
                                state["started"] = True

                        function_arguments = getattr(function_call, "arguments", None)
                        if function_arguments:
                            if (
                                state["id"] is not None
                                and state["name"] is not None
                                and not state["started"]
                            ):
                                events.append(
                                    format_sse(
                                        {
                                            "type": "tool-input-start",
                                            "toolCallId": state["id"],
                                            "toolName": state["name"],
                                        }
                                    )
                                )
                                state["started"] = True

                            state["arguments"] += function_arguments
                            if state["id"] is not None:
                                events.append(
                                    format_sse(
                                        {
                                            "type": "tool-input-delta",
                                            "toolCallId": state["id"],
                                            "inputTextDelta": function_arguments,
                                        }
                                    )
                                )

    return events, text_started, finish_reason


async def stream_text(
    client: AsyncOpenAI,
    model: str,
    messages: Sequence[ChatCompletionMessageParam],
    system: Optional[str] = None,
    tools: Optional[Mapping[str, Callable[..., Any]]] = None,
    tool_definitions: Optional[Sequence[Dict[str, Any]]] = None,
    temperature: float = 0.7,
    max_completion_tokens: Optional[int] = None,
    sse_event_callback: Optional[Callable[[str], None]] = None,
):
    """
    Stream text using aisuite and format as Vercel AI SDK SSE events.

    Args:
        client: AsyncOpenAI instance
        model: Model name (e.g., "openai:gpt-4o")
        messages: Chat messages in OpenAI format
        system: System prompt (optional)
        tools: Dict of callable Python functions for tools
        tool_definitions: List of tool definitions in OpenAI format (if tools not provided)
        temperature: Sampling temperature
        max_completion_tokens: Maximum completion tokens to generate

    Yields:
        SSE-formatted strings compatible with Vercel AI SDK
    """
    try:
        message_id = f"msg-{uuid.uuid4().hex}"
        text_stream_id = "text-1"
        text_started = False
        text_finished = False
        finish_reason = None
        usage_data = None
        tool_calls_state: Dict[int, Dict[str, Any]] = {}

        yield format_sse({"type": "start", "messageId": message_id})

        # Prepare messages with system prompt if provided
        chat_messages = list(messages)
        if system:
            # Insert system message at the beginning
            chat_messages.insert(0, {"role": "system", "content": system})

        # Call aisuite with streaming
        # Note: Don't use max_turns - we want manual tool execution with SSE events
        # aisuite returns chunks in OpenAI-compatible format
        # stream = client.chat.completions.create(
        #     model=model,
        #     messages=chat_messages,
        #     stream=True,
        #     temperature=temperature,
        #     max_tokens=max_tokens,
        #     tools=tool_definitions if tool_definitions else None,
        #     # Don't set max_turns - we'll handle tool execution manually
        # )

        async with client.chat.completions.stream(
            model=model,
            messages=chat_messages,
            temperature=temperature,
            max_completion_tokens=max_completion_tokens,
            # tools=tool_definitions if tool_definitions else None,
            store=True,
            # Don't set max_turns - we'll handle tool execution manually
        ) as stream:
            # Process stream chunks
            # aisuite should return an iterable of chunks
            async for chunk in stream:
                # Process chunk and yield events
                events, chunk_text_started, chunk_finish_reason = _process_chunk(
                    chunk, text_stream_id, tool_calls_state
                )

                # Update state from chunk processing
                if chunk_text_started:
                    text_started = True
                if chunk_finish_reason:
                    finish_reason = chunk_finish_reason

                # Yield events
                for event in events:
                    yield event

                # Check for usage data
                if hasattr(chunk, "usage") and chunk.usage is not None:
                    usage_data = chunk.usage

        # Handle finish
        if finish_reason == "stop" and text_started and not text_finished:
            yield format_sse({"type": "text-end", "id": text_stream_id})
            text_finished = True

        # Handle tool calls completion
        if finish_reason == "tool_calls":
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
                    continue

                yield format_sse(
                    {
                        "type": "tool-input-available",
                        "toolCallId": tool_call_id,
                        "toolName": tool_name,
                        "input": parsed_arguments,
                    }
                )

                # Execute tool if provided
                if tools:
                    tool_function = tools.get(tool_name)
                    if tool_function is None:
                        yield format_sse(
                            {
                                "type": "tool-output-error",
                                "toolCallId": tool_call_id,
                                "errorText": f"Tool '{tool_name}' not found.",
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
                                yield format_sse(
                                    {
                                        "type": "tool-output-error",
                                        "toolCallId": tool_call_id,
                                        "toolName": tool_name,
                                        "errorText": str(error),
                                    }
                                )
                                continue
                        else:
                            raise
                    except Exception as error:
                        yield format_sse(
                            {
                                "type": "tool-output-error",
                                "toolCallId": tool_call_id,
                                "toolName": tool_name,
                                "errorText": str(error),
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

        if text_started and not text_finished:
            yield format_sse({"type": "text-end", "id": text_stream_id})
            text_finished = True

        # Finish metadata
        finish_metadata: Dict[str, Any] = {}
        if finish_reason is not None:
            finish_metadata["finishReason"] = finish_reason.replace("_", "-")

        if usage_data is not None:
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
        traceback.print_exc()
        raise


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
