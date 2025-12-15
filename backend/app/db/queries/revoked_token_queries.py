"""
Database queries for revoked JWT tokens.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.revoked_token import RevokedToken


async def revoke_token(
    session: AsyncSession, jti: str, user_id: UUID, expires_at: datetime
) -> RevokedToken:
    """
    Revoke a JWT token by storing its JWT ID (jti) in the database.
    Returns the RevokedToken object.
    """
    revoked_token = RevokedToken(
        jti=jti,
        user_id=user_id,
        expires_at=expires_at,
        revoked_at=datetime.utcnow(),
    )

    session.add(revoked_token)
    await session.commit()
    await session.refresh(revoked_token)

    return revoked_token


async def is_token_revoked(session: AsyncSession, jti: str) -> bool:
    """
    Check if a JWT token is revoked by looking up its JWT ID (jti).
    Returns True if token is revoked, False otherwise.
    """
    result = await session.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    revoked_token = result.scalar_one_or_none()

    return revoked_token is not None


async def cleanup_expired_revoked_tokens(session: AsyncSession) -> int:
    """
    Delete revoked tokens that have expired.
    This is a cleanup function that should be run periodically.
    Returns the number of tokens deleted.
    """
    now = datetime.utcnow()
    result = await session.execute(delete(RevokedToken).where(RevokedToken.expires_at < now))
    await session.commit()
    return result.rowcount
