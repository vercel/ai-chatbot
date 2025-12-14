from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

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
    Get current user from JWT token or session cookies.
    Checks cookies first (httpOnly cookie), then Authorization header (backward compatibility).
    If JWT expires but guest_session_id or user_session_id exists, restores the user.
    """
    import logging

    logger = logging.getLogger(__name__)

    # Log all cookies received for debugging
    all_cookies = list(request.cookies.keys())
    logger.info(
        "get_current_user: cookies received: %s",
        all_cookies,
    )
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
    logger.info(
        "JWT expired/invalid, checking guest_session_id cookie: present=%s",
        guest_session_id is not None,
    )
    if guest_session_id:
        # guest_session_id is an HMAC-signed token, validate it first
        validated_user_id = validate_session_token(guest_session_id)
        logger.info(
            "guest_session_id validation: token=%s, validated_user_id=%s",
            guest_session_id[:20] + "..." if len(guest_session_id) > 20 else guest_session_id,
            validated_user_id,
        )
        if validated_user_id:
            # Try to restore guest user from validated session token
            from uuid import UUID

            from app.db.queries.user_queries import get_user_by_id

            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                logger.info(
                    "Guest user lookup: user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
                # Verify it's actually a guest user
                if (
                    user
                    and user.email
                    and user.email.startswith("guest-")
                    and user.email.endswith("@anonymous.local")
                ):
                    # Valid guest user - return it (caller should issue new JWT)
                    logger.info(
                        "Restoring guest user: id=%s, type=guest",
                        str(user.id),
                    )
                    return {"id": str(user.id), "type": "guest", "_restore_guest": True}
                else:
                    logger.warning(
                        "guest_session_id points to non-guest user: user_id=%s, email=%s",
                        user_id,
                        user.email if user else None,
                    )
            except (ValueError, TypeError) as e:
                # Invalid UUID format - ignore
                logger.warning("Invalid UUID format from guest_session_id: %s", e)
                pass

    # Try user_session_id (for regular users - fallback if JWT key is lost)
    user_session_id = request.cookies.get("user_session_id")
    logger.info(
        "Checking user_session_id cookie: present=%s",
        user_session_id is not None,
    )
    if user_session_id:
        # Validate session token (HMAC-signed user ID)
        validated_user_id = validate_session_token(user_session_id)
        logger.info(
            "user_session_id validation: token=%s, validated_user_id=%s",
            user_session_id[:20] + "..." if len(user_session_id) > 20 else user_session_id,
            validated_user_id,
        )
        if validated_user_id:
            # Try to restore regular user from validated session token
            from uuid import UUID

            from app.db.queries.user_queries import get_user_by_id

            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                logger.info(
                    "Regular user lookup: user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
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
                    logger.info(
                        "Restoring regular user: id=%s, type=regular",
                        str(user.id),
                    )
                    return {"id": str(user.id), "type": "regular", "_restore_user": True}
                else:
                    logger.warning(
                        "user_session_id points to guest user: user_id=%s, email=%s",
                        user_id,
                        user.email if user else None,
                    )
            except (ValueError, TypeError) as e:
                # Invalid UUID format - ignore
                logger.warning("Invalid UUID format from user_session_id: %s", e)
                pass
        else:
            # Validation failed - might be an old raw UUID cookie (backward compatibility)
            # Try to parse it as a UUID directly
            logger.warning(
                "user_session_id validation failed, trying as raw UUID (backward compatibility)"
            )
            from uuid import UUID

            from app.db.queries.user_queries import get_user_by_id

            try:
                # Try to parse as UUID (might be old raw UUID cookie)
                user_id = UUID(user_session_id)
                user = await get_user_by_id(db, user_id)
                logger.info(
                    "Regular user lookup (raw UUID fallback): user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
                # Verify it's NOT a guest user (regular user)
                if (
                    user
                    and user.email
                    and not (
                        user.email.startswith("guest-") and user.email.endswith("@anonymous.local")
                    )
                ):
                    # Valid regular user - return it (caller should issue new HMAC-signed token)
                    logger.info(
                        "Restoring regular user from raw UUID (backward compatibility): id=%s, type=regular",
                        str(user.id),
                    )
                    return {"id": str(user.id), "type": "regular", "_restore_user": True}
                else:
                    logger.warning(
                        "user_session_id (raw UUID) points to guest user: user_id=%s, email=%s",
                        user_id,
                        user.email if user else None,
                    )
            except (ValueError, TypeError) as e:
                # Not a valid UUID either - cookie is completely invalid
                logger.warning("user_session_id is neither HMAC-signed token nor valid UUID: %s", e)
                pass

    # No valid token and no valid session cookies
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Optional authentication - returns None if no token provided.
    Still attempts to restore users from session cookies (guest_session_id, user_session_id).
    """
    import logging

    logger = logging.getLogger(__name__)
    try:
        user = await get_current_user(request, credentials, db)
        logger.info(
            "get_optional_user: restored user=%s, type=%s",
            user.get("id") if user else None,
            user.get("type") if user else None,
        )
        return user
    except HTTPException as e:
        logger.info(
            "get_optional_user: no valid authentication (status=%s, detail=%s)",
            e.status_code,
            e.detail,
        )
        return None
