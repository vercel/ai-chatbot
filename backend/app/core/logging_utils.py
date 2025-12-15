"""
Logging utilities for security and privacy.
Provides functions to redact or hash sensitive information in logs.
"""

import hashlib
import re


def hash_email(email: str) -> str:
    """
    Hash an email address for logging purposes.
    Returns a consistent hash that can be used to track the same email
    across logs without exposing the actual email.
    """
    if not email:
        return "none"
    # Use SHA256 hash, but only show first 8 characters for readability
    # Full hash is available if needed for correlation
    email_hash = hashlib.sha256(email.encode("utf-8")).hexdigest()
    return f"email:{email_hash[:8]}"


def redact_email(email: str) -> str:
    """
    Redact an email address for logging.
    Shows only the domain part, e.g., "u***@example.com"
    """
    if not email:
        return "none"
    if "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        redacted_local = "*" * len(local)
    else:
        redacted_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{redacted_local}@{domain}"


def hash_user_id(user_id: str) -> str:
    """
    Hash a user ID for logging purposes.
    Returns a consistent hash that can be used to track the same user
    across logs without exposing the actual UUID.
    """
    if not user_id:
        return "none"
    # Use SHA256 hash, but only show first 8 characters for readability
    user_hash = hashlib.sha256(str(user_id).encode("utf-8")).hexdigest()
    return f"user:{user_hash[:8]}"


def redact_user_id(user_id: str) -> str:
    """
    Redact a user ID for logging.
    Shows only first 4 and last 4 characters, e.g., "1234-...-5678"
    """
    if not user_id:
        return "none"
    user_str = str(user_id)
    if len(user_str) <= 8:
        return "*" * len(user_str)
    return f"{user_str[:4]}...{user_str[-4:]}"


def sanitize_log_message(message: str) -> str:
    """
    Sanitize a log message by redacting common patterns of sensitive data.
    This is a fallback for cases where sensitive data might be in free-form text.
    """
    if not message:
        return message

    # Redact email addresses
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    message = re.sub(email_pattern, lambda m: redact_email(m.group()), message)

    # Redact UUIDs (common format)
    uuid_pattern = r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b"
    message = re.sub(
        uuid_pattern, lambda m: redact_user_id(m.group()), message, flags=re.IGNORECASE
    )

    return message
