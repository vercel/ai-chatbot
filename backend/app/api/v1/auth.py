from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.core.password_validation import is_password_breached, validate_password_strength
from app.core.rate_limit import check_rate_limit
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.session_token import generate_session_token
from app.db.queries.chat_queries import migrate_chats_from_guest_to_user
from app.db.queries.login_attempt_queries import (
    clear_failed_attempts,
    get_recent_failed_attempts,
    record_failed_login,
)
from app.db.queries.password_reset_queries import (
    create_password_reset_token,
    get_password_reset_token,
    mark_token_as_used,
)
from app.db.queries.user_queries import (
    create_guest_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
)

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    password: str
    reset_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user with email and password.
    Returns JWT token and sets httpOnly cookie.
    """
    # Rate limiting: 5 attempts per 15 minutes per IP/email
    await check_rate_limit(
        http_request, "login", max_requests=5, window_seconds=15 * 60, identifier=request.email
    )
    await check_rate_limit(http_request, "login_ip", max_requests=10, window_seconds=15 * 60)

    # Look up user by email
    user = await get_user_by_email(db, request.email)

    # Check for account lockout (if user exists)
    if user:
        failed_attempts = await get_recent_failed_attempts(db, user.id, window_minutes=15)
        max_failed_attempts = 5

        if failed_attempts >= max_failed_attempts:
            # Account is locked
            lockout_duration_minutes = 15
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to too many failed login attempts. Please try again in {lockout_duration_minutes} minutes.",
                headers={"Retry-After": str(lockout_duration_minutes * 60)},
            )

    if not user or not user.password:
        # Use dummy password comparison to prevent timing attacks
        dummy_hash = get_password_hash("dummy")
        verify_password(request.password, dummy_hash)
        # Record failed attempt if user exists
        if user:
            ip_address = http_request.client.host if http_request.client else "unknown"
            await record_failed_login(db, user.id, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(request.password, user.password):
        # Record failed login attempt
        ip_address = http_request.client.host if http_request.client else "unknown"
        await record_failed_login(db, user.id, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Successful login - clear failed attempts
    await clear_failed_attempts(db, user.id)

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id), "type": "regular"})

    # Create response
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "regular",
        },
    }

    # Set httpOnly cookie
    response = JSONResponse(content=response_data)
    is_production = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=30 * 60,  # 30 minutes
        path="/",
    )

    # Also set user_session_id cookie for regular users (fallback if JWT key is lost)
    # Use HMAC-signed token instead of raw user ID for security
    session_token = generate_session_token(str(user.id))
    response.set_cookie(
        key="user_session_id",
        value=session_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
        path="/",
    )

    return response


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user with email and password.
    Returns JWT token and sets httpOnly cookie.
    """
    # Rate limiting: 3 registrations per hour per IP
    await check_rate_limit(http_request, "register", max_requests=3, window_seconds=60 * 60)

    import logging

    logger = logging.getLogger(__name__)
    logger.info("=== POST /api/auth/register called ===")
    logger.info("Email: %s", request.email)

    try:
        # Validate password length (bcrypt has a 72-byte limit)
        # Using UTF-8 encoding, so we check character length (most characters are 1 byte)
        # To be safe, we limit to 72 characters
        if len(request.password.encode("utf-8")) > 72:
            logger.warning("Password too long: %d bytes", len(request.password.encode("utf-8")))
            raise ChatSDKError(
                "bad_request:api",
                "Password cannot exceed 72 characters",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password strength
        is_valid, error_message = validate_password_strength(request.password)
        if not is_valid:
            logger.warning("Password strength validation failed: %s", error_message)
            raise ChatSDKError(
                "bad_request:api",
                error_message or "Password does not meet strength requirements",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Check for breached passwords (common passwords or HIBP if enabled)
        if await is_password_breached(request.password):
            logger.warning("Breached password detected during registration")
            raise ChatSDKError(
                "bad_request:api",
                "This password has been found in data breaches. Please choose a different password.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already exists
        existing_user = await get_user_by_email(db, request.email)
        if existing_user:
            logger.warning("User already exists: %s", request.email)
            raise ChatSDKError(
                "bad_request:api",
                "Email already registered",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Hash password and create user
        try:
            hashed_password = get_password_hash(request.password)
        except ValueError as e:
            # Password length validation failed
            logger.warning("Password validation failed: %s", str(e))
            raise ChatSDKError(
                "bad_request:api",
                str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
            ) from e

        # Check for guest_session_id cookie - migrate guest conversations if exists
        guest_session_id = http_request.cookies.get("guest_session_id")
        guest_user_id = None
        if guest_session_id:
            # Validate session token (HMAC-signed user ID)
            from app.core.session_token import validate_session_token

            validated_user_id = validate_session_token(guest_session_id)
            if validated_user_id:
                try:
                    guest_user_id = UUID(validated_user_id)
                    # Verify it's actually a guest user
                    guest_user = await get_user_by_id(db, guest_user_id)
                    if not guest_user or not (
                        guest_user.email
                        and guest_user.email.startswith("guest-")
                        and guest_user.email.endswith("@anonymous.local")
                    ):
                        # Not a valid guest user - ignore
                        guest_user_id = None
                except (ValueError, TypeError):
                    # Invalid UUID format - ignore
                    guest_user_id = None

        try:
            user = await create_user(db, request.email, hashed_password)
            logger.info("User created successfully: %s", user.id)

            # Migrate guest data (chats, documents, suggestions, files) to new user account
            if guest_user_id:
                try:
                    migration_result = await migrate_chats_from_guest_to_user(
                        db, guest_user_id, user.id
                    )
                    logger.info(
                        "Migrated guest data from user %s to new user %s: %s",
                        guest_user_id,
                        user.id,
                        migration_result,
                    )
                except Exception as e:
                    # Log error but don't fail registration
                    logger.error("Failed to migrate guest data: %s", e, exc_info=True)
        except IntegrityError as e:
            # Race condition: user was created between check and creation
            logger.warning("IntegrityError during user creation: %s", e)
            await db.rollback()
            raise ChatSDKError(
                "bad_request:api",
                "Email already registered",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error("Error creating user: %s", e, exc_info=True)
            await db.rollback()
            raise ChatSDKError(
                "bad_request:api",
                f"Failed to create user: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Create JWT token
        access_token = create_access_token(data={"sub": str(user.id), "type": "regular"})

        # Create response
        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "type": "regular",
            },
        }

        # Set httpOnly cookie
        response = JSONResponse(content=response_data)
        is_production = settings.ENVIRONMENT == "production"
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=30 * 60,  # 30 minutes
            path="/",
        )

        # Clear guest_session_id cookie (user is now registered, no longer a guest)
        if guest_user_id:
            response.delete_cookie(key="guest_session_id", path="/")

        # Set user_session_id cookie for regular users (fallback if JWT key is lost)
        response.set_cookie(
            key="user_session_id",
            value=str(user.id),
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
            path="/",
        )

        return response
    except ChatSDKError:
        # Re-raise ChatSDKError as-is (already properly formatted)
        raise
    except Exception as e:
        # Catch any other unexpected errors
        logger.error("Unexpected error in register: %s", e, exc_info=True)
        raise ChatSDKError(
            "bad_request:api",
            f"Registration failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/guest", response_model=TokenResponse)
async def create_guest(http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Create a guest user (no email/password required).
    Returns JWT token and sets httpOnly cookies.
    Sets both auth_token (30 min) and guest_session_id (400 days) for persistence.
    """
    # Rate limiting: 10 guest users per minute per IP
    await check_rate_limit(http_request, "guest", max_requests=10, window_seconds=60)

    # Check if guest_session_id cookie exists - reuse existing guest user
    guest_session_id = http_request.cookies.get("guest_session_id")
    user = None

    if guest_session_id:
        # Validate session token (HMAC-signed user ID)
        from app.core.session_token import validate_session_token

        validated_user_id = validate_session_token(guest_session_id)
        if validated_user_id:
            # Try to restore existing guest user
            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                # Verify it's actually a guest user (email pattern check)
                if (
                    user
                    and user.email
                    and user.email.startswith("guest-")
                    and user.email.endswith("@anonymous.local")
                ):
                    # Valid existing guest user - reuse it
                    pass
                else:
                    # Not a guest user or invalid - create new one
                    user = None
            except (ValueError, TypeError):
                # Invalid UUID format - create new guest user
                user = None

    # Create new guest user if we don't have a valid one
    if not user:
        user = await create_guest_user(db)

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id), "type": "guest"})

    # Create response
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "guest",
        },
    }

    # Set httpOnly cookies
    response = JSONResponse(content=response_data)
    is_production = settings.ENVIRONMENT == "production"

    # Short-lived JWT token (30 minutes)
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=30 * 60,  # 30 minutes
        path="/",
    )

    # Long-lived guest session ID (400 days - browser max)
    # This allows restoring the same guest user after JWT expires
    # Use HMAC-signed token instead of raw user ID for security
    guest_session_token = generate_session_token(str(user.id))
    response.set_cookie(
        key="guest_session_id",
        value=guest_session_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
        path="/",
    )

    return response


@router.post("/logout")
async def logout(http_request: Request):
    """
    Logout user by clearing auth cookies.
    Clears auth_token, guest_session_id, and user_session_id cookies.
    """
    response = JSONResponse(content={"success": True})
    response.delete_cookie(key="auth_token", path="/")
    response.delete_cookie(key="guest_session_id", path="/")
    response.delete_cookie(key="user_session_id", path="/")
    return response


@router.get("/me")
async def get_current_user_info(
    http_request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authenticated user information.
    Returns user data from JWT token.
    If JWT expired but guest_session_id exists, issues new JWT and refreshes cookies.
    """
    # Handle case where auth is disabled and session_id is not a UUID
    user_id_str = current_user.get("id")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )

    # Try to convert to UUID - if it fails, it might be a session ID (when auth is disabled)
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError):
        # If auth is disabled, return the session-based user info directly
        # without querying the database (since session IDs aren't in the DB)
        if settings.DISABLE_AUTH:
            return {
                "id": user_id_str,
                "email": None,
                "type": current_user.get("type", "guest"),
            }
        # If auth is enabled but ID is invalid, raise error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid user ID format: {user_id_str}",
        )

    user = await get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    response_data = {
        "id": str(user.id),
        "email": user.email,
        "type": current_user.get("type", "regular"),
    }

    # If this was a user restoration (guest or regular), issue new JWT token
    is_restoration = current_user.get("_restore_guest") or current_user.get("_restore_user")
    user_type = current_user.get("type", "regular")

    if is_restoration:
        # Create new JWT token for restored user
        access_token = create_access_token(data={"sub": str(user.id), "type": user_type})

        # Create response with new token
        response = JSONResponse(content=response_data)
        is_production = settings.ENVIRONMENT == "production"

        # Set new JWT token (30 minutes)
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=30 * 60,  # 30 minutes
            path="/",
        )

        # Refresh session ID cookie (sliding expiry - 400 days)
        if user_type == "guest":
            # Refresh guest_session_id cookie
            response.set_cookie(
                key="guest_session_id",
                value=str(user.id),
                httponly=True,
                secure=is_production,
                samesite="lax",
                max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
                path="/",
            )
        else:
            # Refresh user_session_id cookie for regular users
            response.set_cookie(
                key="user_session_id",
                value=str(user.id),
                httponly=True,
                secure=is_production,
                samesite="lax",
                max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
                path="/",
            )

        return response

    # Regular response (no token refresh needed)
    return response_data


@router.post("/password-reset/request")
async def request_password_reset(
    request: PasswordResetRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset.
    This endpoint works even if JWT tokens are invalid (for recovery scenarios).
    In production, sends an email with reset link. Never returns token in response.
    """
    # Rate limiting: 3 requests per hour per email, 5 per hour per IP
    await check_rate_limit(
        http_request,
        "password_reset",
        max_requests=3,
        window_seconds=60 * 60,
        identifier=request.email,
    )
    await check_rate_limit(
        http_request, "password_reset_ip", max_requests=5, window_seconds=60 * 60
    )

    import logging

    logger = logging.getLogger(__name__)
    logger.info("Password reset requested for email: %s", request.email)

    # Look up user by email
    user = await get_user_by_email(db, request.email)

    if not user:
        # Don't reveal if user exists (security best practice)
        # Return success even if user doesn't exist to prevent email enumeration
        logger.warning("Password reset requested for non-existent email")
        return {"success": True, "message": "If the email exists, a reset link has been sent."}

    # Create password reset token
    try:
        reset_token_obj = await create_password_reset_token(db, user.id, expires_in_hours=1)
        logger.info("Password reset token created for user: %s", user.id)

        # TODO: In production, send email with reset link
        # For now, we'll log it (in production, remove this and send email)
        if settings.ENVIRONMENT == "development":
            logger.info(
                "DEV MODE: Password reset token for %s: %s",
                request.email,
                reset_token_obj.token,
            )
            # In development, we can return the token for testing
            # But this should be removed or only enabled via a flag
            return {
                "success": True,
                "message": "Password reset link sent (dev mode: token in logs)",
                # Only return token in development for testing
                "reset_token": reset_token_obj.token
                if settings.ENVIRONMENT == "development"
                else None,
            }
        else:
            # In production, send email (implement email service)
            # For now, just return success
            # TODO: Implement email sending
            return {"success": True, "message": "If the email exists, a reset link has been sent."}

    except Exception as e:
        logger.error("Error creating password reset token: %s", e, exc_info=True)
        # Still return success to prevent enumeration
        return {"success": True, "message": "If the email exists, a reset link has been sent."}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    request: PasswordResetConfirmRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm password reset with token.
    This endpoint works even if JWT tokens are invalid (for recovery scenarios).
    Validates token, checks expiration, and resets password.
    """
    # Rate limiting: 5 attempts per 15 minutes per IP
    await check_rate_limit(
        http_request, "password_reset_confirm", max_requests=5, window_seconds=15 * 60
    )

    import logging

    logger = logging.getLogger(__name__)
    logger.info("Password reset confirmation attempted for email: %s", request.email)

    # Validate password length
    if len(request.password.encode("utf-8")) > 72:
        raise ChatSDKError(
            "bad_request:api",
            "Password cannot exceed 72 characters",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate password strength
    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        logger.warning("Password strength validation failed during reset: %s", error_message)
        raise ChatSDKError(
            "bad_request:api",
            error_message or "Password does not meet strength requirements",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Check for breached passwords (common passwords or HIBP if enabled)
    if await is_password_breached(request.password):
        logger.warning("Breached password detected during password reset")
        raise ChatSDKError(
            "bad_request:api",
            "This password has been found in data breaches. Please choose a different password.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Look up user by email
    user = await get_user_by_email(db, request.email)

    if not user:
        # Don't reveal if user exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reset token or email",
        )

    # Get and validate reset token
    reset_token_obj = await get_password_reset_token(db, request.reset_token)

    if not reset_token_obj:
        logger.warning("Invalid password reset token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reset token or email",
        )

    # Verify token belongs to this user
    if reset_token_obj.user_id != user.id:
        logger.warning(
            "Password reset token user mismatch: token_user=%s, request_user=%s",
            reset_token_obj.user_id,
            user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reset token or email",
        )

    # Check if token is valid (not expired, not used)
    if not reset_token_obj.is_valid():
        logger.warning(
            "Password reset token invalid: expired=%s, used=%s",
            datetime.utcnow() >= reset_token_obj.expires_at,
            reset_token_obj.used,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Reset token has expired or already been used",
        )

    # Hash new password
    try:
        hashed_password = get_password_hash(request.password)
    except ValueError as e:
        logger.warning("Password validation failed: %s", str(e))
        raise ChatSDKError(
            "bad_request:api",
            str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        ) from e

    # Update user password
    user.password = hashed_password
    await db.commit()
    await db.refresh(user)

    # Mark token as used
    await mark_token_as_used(db, reset_token_obj)

    logger.info("Password reset successful for user: %s", user.id)

    # Create new JWT token (user can now login)
    access_token = create_access_token(data={"sub": str(user.id), "type": "regular"})

    # Create response
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "type": "regular",
        },
    }

    # Set httpOnly cookie
    response = JSONResponse(content=response_data)
    is_production = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=30 * 60,  # 30 minutes
        path="/",
    )

    # Also set user_session_id cookie for regular users (fallback if JWT key is lost)
    # Use HMAC-signed token instead of raw user ID for security
    session_token = generate_session_token(str(user.id))
    response.set_cookie(
        key="user_session_id",
        value=session_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=400 * 24 * 60 * 60,  # 400 days (browser maximum)
        path="/",
    )

    return response
