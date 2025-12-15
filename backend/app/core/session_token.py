"""
Secure session token generation and validation.
Used for fallback authentication when JWT key is lost.
"""

import hashlib
import hmac
from typing import Optional

from app.config import settings


def generate_session_token(user_id: str) -> str:
    """
    Generate a secure session token by signing the user ID with HMAC.
    Format: {user_id}:{hmac_signature}

    Uses SESSION_SECRET_KEY if configured, otherwise falls back to JWT_SECRET_KEY
    for backward compatibility.
    """
    # Use SESSION_SECRET_KEY if configured, otherwise fall back to JWT_SECRET_KEY
    session_secret = settings.SESSION_SECRET_KEY or settings.JWT_SECRET_KEY
    secret = session_secret.encode("utf-8")
    user_id_bytes = user_id.encode("utf-8")

    # Generate HMAC signature
    signature = hmac.new(secret, user_id_bytes, hashlib.sha256).hexdigest()

    # Return user_id:signature
    return f"{user_id}:{signature}"


def validate_session_token(token: str) -> Optional[str]:
    """
    Validate a session token and return the user ID if valid.
    Returns None if token is invalid.

    Tries SESSION_SECRET_KEY first, then falls back to JWT_SECRET_KEY for
    backward compatibility with existing tokens.
    """
    try:
        # Split token into user_id and signature
        if ":" not in token:
            return None

        user_id, provided_signature = token.split(":", 1)
        user_id_bytes = user_id.encode("utf-8")

        # Try SESSION_SECRET_KEY first (if configured)
        if settings.SESSION_SECRET_KEY:
            secret = settings.SESSION_SECRET_KEY.encode("utf-8")
            expected_signature = hmac.new(secret, user_id_bytes, hashlib.sha256).hexdigest()
            if hmac.compare_digest(provided_signature, expected_signature):
                return user_id

        # Fall back to JWT_SECRET_KEY for backward compatibility
        secret = settings.JWT_SECRET_KEY.encode("utf-8")
        expected_signature = hmac.new(secret, user_id_bytes, hashlib.sha256).hexdigest()

        # Use constant-time comparison to prevent timing attacks
        if not hmac.compare_digest(provided_signature, expected_signature):
            return None

        return user_id
    except (ValueError, AttributeError):
        return None
