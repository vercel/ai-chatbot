from datetime import datetime
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
            "createdAt": vote.createdAt.isoformat() if vote.createdAt else None,
            "updatedAt": vote.updatedAt.isoformat() if vote.updatedAt else None,
            "voteCreatedAt": vote.voteCreatedAt.isoformat() if vote.voteCreatedAt else None,
            "voteUpdatedAt": vote.voteUpdatedAt.isoformat() if vote.voteUpdatedAt else None,
            "feedbackCreatedAt": vote.feedbackCreatedAt.isoformat()
            if vote.feedbackCreatedAt
            else None,
            "feedbackUpdatedAt": vote.feedbackUpdatedAt.isoformat()
            if vote.feedbackUpdatedAt
            else None,
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
    now = datetime.utcnow()

    # Check if vote already exists
    result = await session.execute(select(Vote).where(Vote.messageId == message_id))
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # Update existing vote
        vote_changed = False
        feedback_changed = False

        if vote_type is not None:
            # Vote is being set/changed
            if existing_vote.isUpvoted != is_upvoted:
                vote_changed = True
                existing_vote.isUpvoted = is_upvoted
                # Set voteCreatedAt if this is the first time voting
                if existing_vote.voteCreatedAt is None:
                    existing_vote.voteCreatedAt = now
                # Always update voteUpdatedAt when vote changes
                existing_vote.voteUpdatedAt = now

        if feedback is not None:
            # Feedback is being set/changed
            if existing_vote.feedback != feedback:
                feedback_changed = True
                existing_vote.feedback = feedback
                # Set feedbackCreatedAt if this is the first time providing feedback
                if existing_vote.feedbackCreatedAt is None:
                    existing_vote.feedbackCreatedAt = now
                # Always update feedbackUpdatedAt when feedback changes
                existing_vote.feedbackUpdatedAt = now

        # Update general timestamp when any field is modified
        if vote_changed or feedback_changed:
            existing_vote.updatedAt = now

        await session.commit()
        await session.refresh(existing_vote)
    else:
        # Insert new vote (can be feedback-only if vote_type is None)
        new_vote = Vote(
            chatId=chat_id,
            messageId=message_id,
            isUpvoted=is_upvoted,
            feedback=feedback,
            createdAt=now,
            updatedAt=now,
        )

        # Set separate timestamps based on what's being provided
        if vote_type is not None:
            new_vote.voteCreatedAt = now
            new_vote.voteUpdatedAt = now

        if feedback is not None:
            new_vote.feedbackCreatedAt = now
            new_vote.feedbackUpdatedAt = now

        session.add(new_vote)
        await session.commit()
        await session.refresh(new_vote)
