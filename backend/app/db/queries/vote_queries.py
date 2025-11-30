from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.vote import Vote


async def get_votes_by_chat_id(session: AsyncSession, chat_id: UUID):
    """Get all votes for a specific chat."""
    result = await session.execute(
        select(Vote).where(Vote.chat_id == chat_id)
    )
    votes = result.scalars().all()

    # Convert to dict format matching frontend expectations
    return [
        {
            "chatId": str(vote.chat_id),
            "messageId": str(vote.message_id),
            "isUpvoted": vote.is_upvoted
        }
        for vote in votes
    ]


async def vote_message(
    session: AsyncSession,
    chat_id: UUID,
    message_id: UUID,
    vote_type: str  # "up" or "down"
):
    """Vote on a message (upvote or downvote)."""
    is_upvoted = vote_type == "up"

    # Check if vote already exists
    result = await session.execute(
        select(Vote).where(Vote.message_id == message_id)
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # Update existing vote
        existing_vote.is_upvoted = is_upvoted
        await session.commit()
        await session.refresh(existing_vote)
    else:
        # Insert new vote
        new_vote = Vote(
            chat_id=chat_id,
            message_id=message_id,
            is_upvoted=is_upvoted
        )
        session.add(new_vote)
        await session.commit()
        await session.refresh(new_vote)

