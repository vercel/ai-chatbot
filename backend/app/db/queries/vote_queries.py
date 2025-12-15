from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vote import Vote


async def get_votes_by_chat_id(session: AsyncSession, chat_id: UUID):
    """Get all votes for a specific chat."""
    result = await session.execute(select(Vote).where(Vote.chatId == chat_id))
    votes = result.scalars().all()

    # Convert to dict format matching frontend expectations
    return [
        {
            "chatId": str(vote.chatId),
            "messageId": str(vote.messageId),
            "isUpvoted": vote.isUpvoted,
            "feedback": vote.feedback,
        }
        for vote in votes
    ]


async def vote_message(
    session: AsyncSession,
    chat_id: UUID,
    message_id: UUID,
    vote_type: str | None,  # "up", "down", or None (for feedback-only)
    feedback: str | None = None,
):
    """Vote on a message (upvote or downvote) and/or provide feedback."""
    is_upvoted = None if vote_type is None else (vote_type == "up")

    # Check if vote already exists
    result = await session.execute(select(Vote).where(Vote.messageId == message_id))
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # Update existing vote
        if vote_type is not None:
            existing_vote.isUpvoted = is_upvoted
        if feedback is not None:
            existing_vote.feedback = feedback
        await session.commit()
        await session.refresh(existing_vote)
    else:
        # Insert new vote (can be feedback-only if vote_type is None)
        new_vote = Vote(
            chatId=chat_id, messageId=message_id, isUpvoted=is_upvoted, feedback=feedback
        )
        session.add(new_vote)
        await session.commit()
        await session.refresh(new_vote)
