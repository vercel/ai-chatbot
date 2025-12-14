"""
Rate limiting utilities for FastAPI endpoints.
Uses Redis if available, falls back to in-memory storage.
"""

import asyncio
import time
from collections import defaultdict
from typing import Optional

from fastapi import HTTPException, Request, status

# In-memory fallback storage (simple dict)
_memory_store: dict[str, list[float]] = defaultdict(list)
_memory_lock = asyncio.Lock()


async def check_rate_limit(
    request: Request,
    key_prefix: str,
    max_requests: int,
    window_seconds: int,
    identifier: Optional[str] = None,
) -> None:
    """
    Check if request exceeds rate limit.
    Raises HTTPException with 429 if limit exceeded.

    Args:
        request: FastAPI request object
        key_prefix: Prefix for rate limit key (e.g., "login", "register")
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
        identifier: Optional identifier (email, user_id, etc.). If None, uses IP address.

    Raises:
        HTTPException: 429 Too Many Requests if limit exceeded
    """
    # Get identifier (IP address or custom identifier)
    if identifier:
        key_id = identifier
    else:
        # Use IP address
        if request.client:
            key_id = request.client.host
        else:
            key_id = "unknown"

    # Create rate limit key
    rate_limit_key = f"rate_limit:{key_prefix}:{key_id}"

    # Try Redis first, fall back to in-memory
    try:
        from app.core.redis import get_redis_client

        redis_client = await get_redis_client()
        if redis_client:
            # Use Redis for rate limiting
            current_time = time.time()
            window_start = current_time - window_seconds

            # Remove old entries
            await redis_client.zremrangebyscore(rate_limit_key, "-inf", window_start)

            # Count current requests in window
            count = await redis_client.zcard(rate_limit_key)

            if count >= max_requests:
                # Get oldest request time for retry-after header
                oldest = await redis_client.zrange(rate_limit_key, 0, 0, withscores=True)
                if oldest:
                    retry_after = int(oldest[0][1] - current_time + window_seconds)
                else:
                    retry_after = window_seconds

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

            # Add current request
            await redis_client.zadd(rate_limit_key, {str(current_time): current_time})
            await redis_client.expire(rate_limit_key, window_seconds)

            return

    except Exception:
        # Redis not available or error - fall back to in-memory
        pass

    # Fall back to in-memory rate limiting
    async with _memory_lock:
        current_time = time.time()
        window_start = current_time - window_seconds

        # Clean up old entries
        requests = _memory_store[rate_limit_key]
        requests[:] = [req_time for req_time in requests if req_time > window_start]

        # Check limit
        if len(requests) >= max_requests:
            retry_after = int(
                window_seconds - (current_time - requests[0]) if requests else window_seconds
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        # Add current request
        requests.append(current_time)


async def get_rate_limit_info(
    request: Request,
    key_prefix: str,
    window_seconds: int,
    identifier: Optional[str] = None,
) -> dict:
    """
    Get current rate limit status (for debugging/monitoring).
    Returns remaining requests and reset time.
    """
    # Get identifier
    if identifier:
        key_id = identifier
    else:
        if request.client:
            key_id = request.client.host
        else:
            key_id = "unknown"

    rate_limit_key = f"rate_limit:{key_prefix}:{key_id}"

    # Try Redis first
    try:
        from app.core.redis import get_redis_client

        redis_client = await get_redis_client()
        if redis_client:
            current_time = time.time()
            window_start = current_time - window_seconds

            # Count requests in window
            count = await redis_client.zcard(rate_limit_key)
            reset_time = current_time + window_seconds

            return {
                "remaining": 0,  # Would need max_requests to calculate
                "reset_at": reset_time,
                "count": count,
            }
    except Exception:
        pass

    # Fall back to in-memory
    async with _memory_lock:
        current_time = time.time()
        window_start = current_time - window_seconds

        requests = _memory_store[rate_limit_key]
        requests[:] = [req_time for req_time in requests if req_time > window_start]

        return {
            "remaining": 0,  # Would need max_requests to calculate
            "reset_at": current_time + window_seconds,
            "count": len(requests),
        }
