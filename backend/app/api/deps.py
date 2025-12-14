from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.session_token import validate_session_token

security = HTTPBearer(auto_error=False)  # Don't auto-raise error, we'll check cookies first


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user from JWT token or session ID.
    Checks cookies first (httpOnly cookie), then Authorization header (backward compatibility).
    If JWT expires but guest_session_id exists, restores the guest user.
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

        return {"id": session_id, "type": "guest"}

    # Normal authentication flow
    token = None

    # First, try to get token from httpOnly cookie (preferred method)
    cookie_token = request.cookies.get("auth_token")
    if cookie_token:
        token = cookie_token
    # Fallback to Authorization header (for backward compatibility)
    elif credentials:
        token = credentials.credentials

    # If we have a token, try to decode it
    if token:
        payload = decode_access_token(token)

        if payload is not None:
            # Valid token - return user info
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
                )
            return {"id": user_id, "type": payload.get("type", "regular")}
        # Token expired or invalid - fall through to guest session check

    # No valid token - check for session ID cookies (fallback for JWT key loss)
    # Try guest_session_id first (for guest users)
    guest_session_id = request.cookies.get("guest_session_id")
    if guest_session_id:
        # Try to restore guest user from guest_session_id
        from uuid import UUID

        from app.db.queries.user_queries import get_user_by_id

        try:
            user_id = UUID(guest_session_id)
            user = await get_user_by_id(db, user_id)
            # Verify it's actually a guest user
            if (
                user
                and user.email
                and user.email.startswith("guest-")
                and user.email.endswith("@anonymous.local")
            ):
                # Valid guest user - return it (caller should issue new JWT)
                return {"id": str(user.id), "type": "guest", "_restore_guest": True}
        except (ValueError, TypeError):
            # Invalid UUID format - ignore
            pass

    # Try user_session_id (for regular users - fallback if JWT key is lost)
    user_session_id = request.cookies.get("user_session_id")
    if user_session_id:
        # Validate session token (HMAC-signed user ID)
        validated_user_id = validate_session_token(user_session_id)
        if validated_user_id:
            # Try to restore regular user from validated session token
            from uuid import UUID

            from app.db.queries.user_queries import get_user_by_id

            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                # Verify it's NOT a guest user (regular user)
                if (
                    user
                    and user.email
                    and not (
                        user.email.startswith("guest-") and user.email.endswith("@anonymous.local")
                    )
                ):
                    # Valid regular user - return it (caller should issue new JWT)
                    # This is a fallback mechanism for JWT key loss scenarios
                    return {"id": str(user.id), "type": "regular", "_restore_user": True}
            except (ValueError, TypeError):
                # Invalid UUID format - ignore
                pass

    # No valid token and no valid session cookies
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Optional authentication - returns None if no token provided"""
    try:
        return await get_current_user(request, credentials, db)
    except HTTPException:
        return None
