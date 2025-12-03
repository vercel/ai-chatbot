from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_access_token
from app.config import settings
from typing import Optional

security = HTTPBearer(auto_error=False)  # Don't auto-raise error, we'll check cookies first


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user from JWT token or session ID.
    Checks cookies first (httpOnly cookie), then Authorization header (backward compatibility).
    If authentication is disabled, uses session ID from X-Session-Id header.
    """
    # If authentication is disabled, use session ID
    if settings.DISABLE_AUTH:
        session_id = request.headers.get("X-Session-Id")
        if not session_id:
            # Generate a temporary session ID if not provided
            # This shouldn't happen in normal operation, but handle gracefully
            session_id = f"session-{request.client.host if request.client else 'unknown'}"

        import logging
        logger = logging.getLogger(__name__)
        logger.info(
            "Auth disabled: session_id=%s, X-Session-Id header=%s",
            session_id,
            request.headers.get("X-Session-Id"),
        )

        return {
            "id": session_id,
            "type": "guest"
        }

    # Normal authentication flow
    token = None

    # First, try to get token from httpOnly cookie (preferred method)
    cookie_token = request.cookies.get("auth_token")
    if cookie_token:
        token = cookie_token
    # Fallback to Authorization header (for backward compatibility)
    elif credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # TODO: Fetch user from database
    # For now, return the payload
    return {
        "id": user_id,
        "type": payload.get("type", "regular")
    }


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Optional authentication - returns None if no token provided"""
    try:
        return await get_current_user(request, credentials, db)
    except HTTPException:
        return None

