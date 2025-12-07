"""Resumable stream utilities for storing and retrieving stream chunks from Redis."""

import logging
from typing import AsyncIterator, Optional
from uuid import UUID

from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)

# Redis key patterns
STREAM_CHUNKS_KEY = "stream:{stream_id}:chunks"
STREAM_SEQ_KEY = "stream:{stream_id}:seq"
STREAM_STATE_KEY = "stream:{stream_id}:state"
STREAM_TTL = 3600  # 1 hour TTL for stream data


async def store_stream_chunk(stream_id: UUID, chunk: bytes, sequence: int) -> bool:
    """
    Store a stream chunk in Redis with sequence number to ensure order.
    Uses hash with sequence number as key to maintain order and handle duplicate chunks.
    Returns True if successful, False if Redis is not available.
    This function is designed to be called as a fire-and-forget task,
    so errors are logged but not raised.
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False

        chunks_key = STREAM_CHUNKS_KEY.format(stream_id=str(stream_id))
        # Store chunk in hash with sequence number as key
        # This ensures chunks can be retrieved in order even if stored out of order
        # and handles duplicate chunks correctly
        await redis_client.hset(chunks_key, str(sequence), chunk)
        # Set TTL on the key
        await redis_client.expire(chunks_key, STREAM_TTL)
        return True
    except Exception as e:
        # Log but don't raise - this is fire-and-forget
        logger.debug("Failed to store stream chunk (non-critical): %s", e)
        return False


async def mark_stream_complete(stream_id: UUID) -> bool:
    """
    Mark a stream as complete in Redis.
    Returns True if successful, False if Redis is not available.
    This function is designed to be called as a fire-and-forget task,
    so errors are logged but not raised.
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False

        state_key = STREAM_STATE_KEY.format(stream_id=str(stream_id))
        await redis_client.set(state_key, "complete", ex=STREAM_TTL)
        return True
    except Exception as e:
        # Log but don't raise - this is fire-and-forget
        logger.debug("Failed to mark stream as complete (non-critical): %s", e)
        return False


async def get_stream_chunks(stream_id: UUID) -> Optional[list[bytes]]:
    """
    Retrieve all chunks for a stream from Redis in order.
    Uses hash (HGETALL) and sorts by sequence number (key) to maintain order.
    Returns None if stream not found or Redis is not available.
    """
    redis_client = await get_redis_client()
    if not redis_client:
        return None

    try:
        chunks_key = STREAM_CHUNKS_KEY.format(stream_id=str(stream_id))
        # Retrieve all chunks from hash
        chunks_dict = await redis_client.hgetall(chunks_key)
        if chunks_dict:
            # Sort by sequence number (key) and return chunks in order
            # Keys are strings (sequence numbers), values are bytes (chunks)
            sorted_items = sorted(chunks_dict.items(), key=lambda x: int(x[0]))
            chunks = [value for _, value in sorted_items]
            return chunks
        return None
    except Exception as e:
        logger.error("Failed to retrieve stream chunks: %s", e)
        return None


async def is_stream_complete(stream_id: UUID) -> bool:
    """
    Check if a stream is marked as complete.
    Returns False if stream not found, not complete, or Redis is not available.
    """
    redis_client = await get_redis_client()
    if not redis_client:
        return False

    try:
        state_key = STREAM_STATE_KEY.format(stream_id=str(stream_id))
        state = await redis_client.get(state_key)
        return state == b"complete"
    except Exception as e:
        logger.error("Failed to check stream state: %s", e)
        return False


async def replay_stream_chunks(chunks: list[bytes]) -> AsyncIterator[bytes]:
    """
    Replay stream chunks as an async iterator.
    Yields each chunk in order.
    """
    for chunk in chunks:
        yield chunk


async def cleanup_stream(stream_id: UUID) -> None:
    """
    Clean up stream data from Redis.
    """
    redis_client = await get_redis_client()
    if not redis_client:
        return

    try:
        chunks_key = STREAM_CHUNKS_KEY.format(stream_id=str(stream_id))
        state_key = STREAM_STATE_KEY.format(stream_id=str(stream_id))
        await redis_client.delete(chunks_key, state_key)
    except Exception as e:
        logger.error("Failed to cleanup stream: %s", e)
