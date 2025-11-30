from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.chat import Chat


async def get_chat_by_id(session: AsyncSession, chat_id: UUID):
    """Get a chat by its ID."""
    result = await session.execute(select(Chat).where(Chat.id == chat_id))
    return result.scalar_one_or_none()
