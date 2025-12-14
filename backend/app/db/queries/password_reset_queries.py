"""
Database queries for password reset tokens.
"""

import secrets
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken


async def create_password_reset_token(
    session: AsyncSession, user_id: UUID, expires_in_hours: int = 1
) -> PasswordResetToken:
    """
    Create a new password reset token for a user.
    Returns the token object (token value is in .token attribute).
    """
    # Generate secure random token
    token = secrets.token_urlsafe(32)

    # Create token record
    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours),
        used=False,
    )

    session.add(reset_token)
    await session.commit()
    await session.refresh(reset_token)

    return reset_token


async def get_password_reset_token(session: AsyncSession, token: str) -> PasswordResetToken | None:
    """
    Get a password reset token by token string.
    Returns None if token doesn't exist.
    """
    result = await session.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    return result.scalar_one_or_none()


async def mark_token_as_used(session: AsyncSession, token: PasswordResetToken) -> None:
    """Mark a password reset token as used."""
    token.used = True
    await session.commit()


async def cleanup_expired_tokens(session: AsyncSession) -> int:
    """
    Delete expired password reset tokens.
    Returns the number of tokens deleted.
    """
    result = await session.execute(
        delete(PasswordResetToken).where(PasswordResetToken.expires_at < datetime.utcnow())
    )
    await session.commit()
    return result.rowcount
