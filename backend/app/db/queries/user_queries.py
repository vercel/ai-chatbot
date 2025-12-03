"""
User database queries.
"""

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

logger = logging.getLogger(__name__)


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user by ID."""
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_or_create_user_for_session(
    session: AsyncSession, user_id: UUID
) -> User:
    """
    Get or create a user for a session ID (when auth is disabled).
    Creates a user with a generated email if it doesn't exist.
    Handles race conditions where multiple requests might try to create the same user.
    """
    # Try to get existing user
    user = await get_user_by_id(session, user_id)
    if user:
        return user

    # Create new user with generated email
    # Email must be unique, so we use the UUID as part of the email
    email = f"session-{user_id}@anonymous.local"
    new_user = User(id=user_id, email=email, password=None)
    session.add(new_user)

    try:
        await session.commit()
        await session.refresh(new_user)
        return new_user
    except IntegrityError:
        # Race condition: user was created by another request
        # Rollback and try to fetch the existing user
        await session.rollback()
        logger.info("User creation race condition detected, fetching existing user: %s", user_id)
        user = await get_user_by_id(session, user_id)
        if user:
            return user
        # If still not found, re-raise the error
        raise

