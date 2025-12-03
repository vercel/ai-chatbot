"""
Utility functions for handling user IDs when authentication is disabled.
Converts session IDs to deterministic UUIDs for database compatibility.
"""

import hashlib
import logging
from uuid import UUID

logger = logging.getLogger(__name__)


def is_session_id(user_id: str) -> bool:
    """Check if a user ID is a session ID (starts with 'session-')."""
    return isinstance(user_id, str) and user_id.startswith("session-")


def session_id_to_uuid(session_id: str) -> UUID:
    """
    Convert a session ID to a deterministic UUID.
    Uses SHA-256 hash of the session ID to generate a UUID v5-like identifier.
    This ensures the same session ID always produces the same UUID.

    IMPORTANT: This function must be deterministic - the same session_id
    must always produce the same UUID, otherwise ownership checks will fail.
    """
    # Validate input
    if not isinstance(session_id, str):
        raise ValueError(f"session_id must be a string, got {type(session_id)}")

    if not session_id.startswith("session-"):
        raise ValueError(f"session_id must start with 'session-', got: {session_id[:20]}...")

    # Hash the session ID using SHA-256 (deterministic)
    hash_obj = hashlib.sha256(session_id.encode("utf-8"))
    hash_bytes = hash_obj.digest()[:16]  # Take first 16 bytes

    # Convert to UUID (set version to 5 and variant bits)
    uuid_bytes = bytearray(hash_bytes)
    uuid_bytes[6] = (uuid_bytes[6] & 0x0F) | 0x50  # Version 5
    uuid_bytes[8] = (uuid_bytes[8] & 0x3F) | 0x80  # Variant 10

    result = UUID(bytes=bytes(uuid_bytes))

    # Log for debugging
    logger.debug("session_id_to_uuid: session_id=%s -> uuid=%s", session_id, result)

    return result


def get_user_id_uuid(user_id: str) -> UUID:
    """
    Convert a user ID to UUID.
    If it's a session ID, converts it to a deterministic UUID.
    Otherwise, assumes it's already a valid UUID string.
    """
    if is_session_id(user_id):
        return session_id_to_uuid(user_id)

    # Try to parse as UUID
    try:
        return UUID(user_id)
    except ValueError as e:
        raise ValueError(f"Invalid user ID format: {user_id}") from e


def user_ids_match(user_id1: str, user_id2: UUID | str) -> bool:
    """
    Check if two user IDs match.
    Handles both UUID and session ID formats.
    """
    uuid1 = get_user_id_uuid(user_id1)

    if isinstance(user_id2, UUID):
        return uuid1 == user_id2

    uuid2 = get_user_id_uuid(user_id2)
    return uuid1 == uuid2
