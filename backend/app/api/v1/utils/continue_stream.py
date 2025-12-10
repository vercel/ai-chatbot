"""Continue stream generation in background after client disconnect."""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.client import AsyncOpenAIChatClientProtocol
from app.core.database import AsyncSessionLocal
from app.db.queries.chat_queries import save_messages, update_chat_last_context_by_id
from app.utils.resumable_stream import mark_stream_complete, store_stream_chunk
from app.utils.stream import stream_text
from app.utils.stream_processor import StreamEventProcessor

logger = logging.getLogger(__name__)


async def _continue_stream_in_background(
    stream_id: UUID,
    chat_id: UUID,
    client: AsyncOpenAIChatClientProtocol,
    model: str,
    messages: List[Dict[str, Any]],
    system: Optional[str],
    tools: Dict[str, Any],
    tool_definitions: List[Dict[str, Any]],
    background_tasks: Any,  # BackgroundTasks
    processor: StreamEventProcessor,
    current_sequence: int,
) -> None:
    """
    Continue stream generation in background after client disconnect.
    This allows the stream to complete even if the user refreshes the browser.

    Note: We restart the stream from the same messages, which may generate
    a slightly different response, but ensures the stream completes.
    """
    logger.info(
        "=== CONTINUING STREAM IN BACKGROUND === stream_id=%s, chat_id=%s, current_sequence=%d",
        stream_id,
        chat_id,
        current_sequence,
    )

    # Create a new processor for background continuation
    # (The original processor's generator is closed)
    background_processor = StreamEventProcessor(chat_id)
    sequence = current_sequence

    try:
        # Restart stream generation from the same messages
        # This will generate the full response (may be slightly different but complete)
        async for event in stream_text(
            client=client,
            model=model,
            messages=messages,
            system=system,
            tools=tools,
            tool_definitions=tool_definitions,
            temperature=0.7,
            max_tool_turns=5,
        ):
            # Convert to bytes
            if isinstance(event, str):
                event_bytes = event.encode("utf-8")
            else:
                event_bytes = event

            # Store chunk in Redis (continue from where we left off)
            current_seq = sequence
            sequence += 1
            await store_stream_chunk(stream_id, event_bytes, current_seq)

            # Process event to build assistant messages
            if isinstance(event, str) and event.startswith("data: "):
                data_str = event[6:].strip()
                if data_str == "[DONE]":
                    break

                try:
                    import json

                    data = json.loads(data_str)
                    background_processor._process_event_data(data)
                except json.JSONDecodeError:
                    pass

        # Stream completed - mark as complete and save messages
        logger.info(
            "=== BACKGROUND STREAM COMPLETED === stream_id=%s, assistant_messages=%d",
            stream_id,
            len(background_processor.assistant_messages),
        )

        # Mark stream as complete
        await mark_stream_complete(stream_id)

        # Save messages to database
        if background_processor.assistant_messages:
            async with AsyncSessionLocal() as session:
                await save_messages(session, background_processor.assistant_messages)

        # Update chat context
        if background_processor.final_usage:
            async with AsyncSessionLocal() as session:
                await update_chat_last_context_by_id(
                    session, chat_id, background_processor.final_usage
                )

    except Exception as e:
        logger.error(
            "Error continuing stream in background: %s, stream_id=%s",
            e,
            stream_id,
            exc_info=True,
        )
        # Still mark as complete to prevent infinite retries
        await mark_stream_complete(stream_id)
