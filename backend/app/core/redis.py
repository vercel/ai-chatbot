"""Redis client for resumable streams."""

import logging
from typing import Optional

import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[Redis] = None


async def get_redis_client() -> Optional[Redis]:
    """
    Get Redis client instance.
    Returns None if REDIS_URL is not configured.
    """
    global _redis_client

    if not settings.REDIS_URL:
        return None

    if _redis_client is None:
        try:
            _redis_client = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=False,  # We store bytes for SSE events
            )
            logger.info("Redis client connected successfully")
        except Exception as e:
            logger.error("Failed to connect to Redis: %s", e)
            return None

    return _redis_client


async def close_redis_client() -> None:
    """Close Redis client connection."""
    global _redis_client

    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis client closed")
