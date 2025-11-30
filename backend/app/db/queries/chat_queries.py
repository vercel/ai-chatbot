from typing import Optional
from uuid import UUID

from sqlalchemy import and_, delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat
from app.models.message import Message
from app.models.stream import Stream
from app.models.vote import Vote


async def get_chat_by_id(session: AsyncSession, chat_id: UUID):
    """Get a chat by its ID."""
    result = await session.execute(select(Chat).where(Chat.id == chat_id))
    return result.scalar_one_or_none()


async def get_chats_by_user_id(
    session: AsyncSession,
    user_id: UUID,
    limit: int = 10,
    starting_after: Optional[UUID] = None,
    ending_before: Optional[UUID] = None,
):
    """
    Get chats for a user with pagination.
    Returns: { chats: List[Chat], hasMore: bool }
    """
    extended_limit = limit + 1  # Fetch one extra to check if there are more

    # Base condition: chats belong to user
    base_condition = Chat.userId == user_id

    # Handle pagination
    if starting_after:
        # Get chats created after the specified chat (newer chats)
        reference_chat = await get_chat_by_id(session, starting_after)
        if not reference_chat:
            from fastapi import status

            from app.core.errors import ChatSDKError

            raise ChatSDKError(
                "not_found:database",
                f"Chat with id {starting_after} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        # Get chats with createdAt > reference (newer), ordered descending
        query = (
            select(Chat)
            .where(and_(base_condition, Chat.createdAt > reference_chat.createdAt))
            .order_by(desc(Chat.createdAt))
        )
    elif ending_before:
        # Get chats created before the specified chat (older chats)
        reference_chat = await get_chat_by_id(session, ending_before)
        if not reference_chat:
            from fastapi import status

            from app.core.errors import ChatSDKError

            raise ChatSDKError(
                "not_found:database",
                f"Chat with id {ending_before} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        # Get chats with createdAt < reference (older), ordered descending
        query = (
            select(Chat)
            .where(and_(base_condition, Chat.createdAt < reference_chat.createdAt))
            .order_by(desc(Chat.createdAt))
        )
    else:
        # No pagination - get most recent chats
        query = select(Chat).where(base_condition).order_by(desc(Chat.createdAt))

    # Apply limit
    query = query.limit(extended_limit)

    # Execute query
    result = await session.execute(query)
    chats = result.scalars().all()

    # Check if there are more results
    has_more = len(chats) > limit

    # Return only the requested number of chats
    return {"chats": chats[:limit] if has_more else chats, "hasMore": has_more}


async def delete_chat_by_id(session: AsyncSession, chat_id: UUID):
    """
    Delete a single chat by ID, including related votes, messages, and streams.
    Returns: The deleted Chat object
    """
    # Delete related records (cascade delete)
    # Delete votes
    await session.execute(delete(Vote).where(Vote.chatId == chat_id))

    # Delete messages
    await session.execute(delete(Message).where(Message.chatId == chat_id))

    # Delete streams
    await session.execute(delete(Stream).where(Stream.chatId == chat_id))

    # Delete chat and return the deleted chat
    result = await session.execute(delete(Chat).where(Chat.id == chat_id).returning(Chat))
    deleted_chat = result.scalar_one_or_none()

    if not deleted_chat:
        return None

    # Commit all deletions
    await session.commit()

    return deleted_chat


async def delete_all_chats_by_user_id(session: AsyncSession, user_id: UUID):
    """
    Delete all chats for a user, including related votes, messages, and streams.
    Returns: { deletedCount: int }
    """
    # First, get all chat IDs for this user
    result = await session.execute(select(Chat.id).where(Chat.userId == user_id))
    chat_ids = [row[0] for row in result.all()]

    if not chat_ids:
        return {"deletedCount": 0}

    # Delete related records (cascade delete)
    # Delete votes
    await session.execute(delete(Vote).where(Vote.chatId.in_(chat_ids)))

    # Delete messages
    await session.execute(delete(Message).where(Message.chatId.in_(chat_ids)))

    # Delete streams
    await session.execute(delete(Stream).where(Stream.chatId.in_(chat_ids)))

    # Delete chats
    result = await session.execute(delete(Chat).where(Chat.userId == user_id).returning(Chat.id))
    deleted_count = len(result.all())

    # Commit all deletions
    await session.commit()

    return {"deletedCount": deleted_count}
