"""Resumable stream utilities for storing and retrieving stream chunks from Redis."""

import logging
from typing import AsyncIterator, Optional
from uuid import UUID

from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)

# Redis key patterns
STREAM_CHUNKS_KEY = "stream:{stream_id}:chunks"
STREAM_STATE_KEY = "stream:{stream_id}:state"
STREAM_TTL = 3600  # 1 hour TTL for stream data


async def store_stream_chunk(stream_id: UUID, chunk: bytes) -> bool:
    """
    Store a stream chunk in Redis.
    Returns True if successful, False if Redis is not available.
    This function is designed to be called as a fire-and-forget task,
    so errors are logged but not raised.
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False

        chunks_key = STREAM_CHUNKS_KEY.format(stream_id=str(stream_id))
        # Append chunk to list (RPUSH)
        await redis_client.rpush(chunks_key, chunk)
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
    Retrieve all chunks for a stream from Redis.
    Returns None if stream not found or Redis is not available.
    """
    redis_client = await get_redis_client()
    if not redis_client:
        return None

    try:
        chunks_key = STREAM_CHUNKS_KEY.format(stream_id=str(stream_id))
        chunks = await redis_client.lrange(chunks_key, 0, -1)
        if chunks:
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
