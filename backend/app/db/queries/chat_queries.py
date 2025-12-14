import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, asc, delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat
from app.models.message import Message
from app.models.stream import Stream
from app.models.vote import Vote

logger = logging.getLogger(__name__)


async def get_chat_by_id(session: AsyncSession, chat_id: UUID):
    """Get a chat by its ID."""
    result = await session.execute(select(Chat).where(Chat.id == chat_id))
    return result.scalar_one_or_none()


async def get_messages_by_chat_id(session: AsyncSession, chat_id: UUID) -> List[Message]:
    """
    Get all messages for a chat, ordered by createdAt ascending.
    Returns: List of Message objects
    """
    result = await session.execute(
        select(Message).where(Message.chatId == chat_id).order_by(asc(Message.createdAt))
    )
    return list(result.scalars().all())


async def save_chat(
    session: AsyncSession,
    chat_id: UUID,
    user_id: UUID,
    title: str,
    visibility: str,
) -> Chat:
    """
    Create a new chat.
    Returns: The created Chat object
    """
    new_chat = Chat(
        id=chat_id,
        userId=user_id,
        title=title,
        visibility=visibility,
    )
    session.add(new_chat)
    await session.commit()
    await session.refresh(new_chat)
    return new_chat


async def save_messages(
    session: AsyncSession,
    messages: List[dict],
) -> List[Message]:
    """
    Save multiple messages to the database.
    messages: List of dicts with keys: id, chatId, role, parts, attachments, createdAt
    Returns: List of saved Message objects
    """
    logger.info("=== save_messages called ===")
    logger.info("Saving %d message(s)", len(messages))
    message_objects = []
    for msg_data in messages:
        message_obj = Message(
            id=UUID(msg_data["id"]) if isinstance(msg_data["id"], str) else msg_data["id"],
            chatId=UUID(msg_data["chatId"])
            if isinstance(msg_data["chatId"], str)
            else msg_data["chatId"],
            role=msg_data["role"],
            parts=msg_data["parts"],
            attachments=msg_data.get("attachments", []),
            createdAt=msg_data.get("createdAt", datetime.utcnow()),
        )
        message_objects.append(message_obj)
        session.add(message_obj)

    await session.commit()
    logger.info("Messages committed to database")
    # Refresh all messages
    for msg in message_objects:
        await session.refresh(msg)

    logger.info("save_messages completed successfully")
    return message_objects


async def create_stream_id(
    session: AsyncSession,
    stream_id: UUID,
    chat_id: UUID,
) -> Stream:
    """
    Create a stream ID entry.
    Returns: The created Stream object
    """
    new_stream = Stream(
        id=stream_id,
        chatId=chat_id,
    )
    session.add(new_stream)
    await session.commit()
    await session.refresh(new_stream)
    return new_stream


async def update_chat_last_context_by_id(
    session: AsyncSession,
    chat_id: UUID,
    context: dict,
) -> Optional[Chat]:
    """
    Update chat's lastContext field with usage/context data.
    Returns: Updated Chat object or None if not found
    """
    logger.info("=== update_chat_last_context_by_id called ===")
    logger.info("Chat ID: %s", chat_id)
    chat = await get_chat_by_id(session, chat_id)
    if not chat:
        logger.warning("Chat not found: %s", chat_id)
        return None

    chat.lastContext = context
    await session.commit()
    logger.info("Chat context updated successfully")
    await session.refresh(chat)
    return chat


async def get_message_count_by_user_id(
    session: AsyncSession,
    user_id: UUID,
    hours: int = 24,
) -> int:
    """
    Count messages for a user in the last N hours.
    Only counts user messages (role='user'), not assistant messages.
    Returns: Count of messages
    """
    hours_ago = datetime.utcnow() - timedelta(hours=hours)

    result = await session.execute(
        select(func.count(Message.id))
        .select_from(Message)
        .join(Chat, Message.chatId == Chat.id)
        .where(
            and_(
                Chat.userId == user_id,
                Message.createdAt >= hours_ago,
                Message.role == "user",
            )
        )
    )

    count_value = result.scalar() or 0
    return count_value


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


async def migrate_chats_from_guest_to_user(
    session: AsyncSession,
    guest_user_id: UUID,
    new_user_id: UUID,
) -> dict:
    """
    Migrate all user data (chats, documents, suggestions, files) from a guest user to a new registered user.
    This is called when a guest user creates an account.
    Returns: Dictionary with counts of migrated items
    """
    from sqlalchemy import update

    from app.models.document import Document
    from app.models.file import File
    from app.models.suggestion import Suggestion

    logger.info(
        "Migrating all data from guest user %s to new user %s",
        guest_user_id,
        new_user_id,
    )

    migration_counts = {
        "chats": 0,
        "documents": 0,
        "suggestions": 0,
        "files": 0,
    }

    # Migrate chats
    result = await session.execute(select(Chat.id).where(Chat.userId == guest_user_id))
    chat_ids = [row[0] for row in result.all()]
    if chat_ids:
        await session.execute(
            update(Chat).where(Chat.userId == guest_user_id).values(userId=new_user_id)
        )
        migration_counts["chats"] = len(chat_ids)
        logger.info("Migrated %d chat(s)", len(chat_ids))

    # Migrate documents
    result = await session.execute(select(Document.id).where(Document.user_id == guest_user_id))
    document_ids = [row[0] for row in result.all()]
    if document_ids:
        await session.execute(
            update(Document).where(Document.user_id == guest_user_id).values(user_id=new_user_id)
        )
        migration_counts["documents"] = len(document_ids)
        logger.info("Migrated %d document(s)", len(document_ids))

    # Migrate suggestions
    result = await session.execute(select(Suggestion.id).where(Suggestion.user_id == guest_user_id))
    suggestion_ids = [row[0] for row in result.all()]
    if suggestion_ids:
        await session.execute(
            update(Suggestion)
            .where(Suggestion.user_id == guest_user_id)
            .values(user_id=new_user_id)
        )
        migration_counts["suggestions"] = len(suggestion_ids)
        logger.info("Migrated %d suggestion(s)", len(suggestion_ids))

    # Migrate files
    result = await session.execute(select(File.id).where(File.user_id == guest_user_id))
    file_ids = [row[0] for row in result.all()]
    if file_ids:
        await session.execute(
            update(File).where(File.user_id == guest_user_id).values(user_id=new_user_id)
        )
        migration_counts["files"] = len(file_ids)
        logger.info("Migrated %d file(s)", len(file_ids))

    # Commit all migrations
    await session.commit()

    total_migrated = sum(migration_counts.values())
    logger.info(
        "Successfully migrated all data from guest to new user: %s (total: %d items)",
        migration_counts,
        total_migrated,
    )

    return migration_counts
