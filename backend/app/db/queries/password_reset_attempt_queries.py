"""
Database queries for tracking failed password reset attempts and account lockouts.
"""

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_attempt import PasswordResetAttempt


async def record_failed_password_reset_attempt(
    session: AsyncSession, user_id: UUID, ip_address: str
) -> PasswordResetAttempt:
    """
    Record a failed password reset attempt.
    Returns the PasswordResetAttempt object.
    """
    attempt = PasswordResetAttempt(
        user_id=user_id,
        ip_address=ip_address,
        attempted_at=datetime.utcnow(),
    )

    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)

    return attempt


async def get_recent_failed_password_reset_attempts(
    session: AsyncSession, user_id: UUID, window_minutes: int = 15
) -> int:
    """
    Get count of failed password reset attempts for a user within the time window.
    Returns the number of failed attempts.
    """
    window_start = datetime.utcnow() - timedelta(minutes=window_minutes)

    result = await session.execute(
        select(PasswordResetAttempt)
        .where(PasswordResetAttempt.user_id == user_id)
        .where(PasswordResetAttempt.attempted_at >= window_start)
    )

    attempts = result.scalars().all()
    return len(attempts)


async def clear_failed_password_reset_attempts(session: AsyncSession, user_id: UUID) -> None:
    """Clear all failed password reset attempts for a user (on successful reset)."""
    await session.execute(
        delete(PasswordResetAttempt).where(PasswordResetAttempt.user_id == user_id)
    )
    await session.commit()


async def cleanup_old_password_reset_attempts(
    session: AsyncSession, older_than_hours: int = 24
) -> int:
    """
    Delete password reset attempts older than specified hours.
    Returns the number of attempts deleted.
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)

    result = await session.execute(
        delete(PasswordResetAttempt).where(PasswordResetAttempt.attempted_at < cutoff_time)
    )
    await session.commit()

    return result.rowcount
