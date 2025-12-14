"""
Utility functions for handling user IDs.
All user IDs are UUIDs (from guest users or regular users).
"""

from uuid import UUID


def get_user_id_uuid(user_id: str) -> UUID:
    """
    Convert a user ID string to UUID.
    All user IDs are UUIDs (no session IDs anymore).
    """
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
