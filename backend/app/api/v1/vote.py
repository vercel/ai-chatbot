from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import get_chat_by_id
from app.db.queries.vote_queries import get_votes_by_chat_id, vote_message

router = APIRouter()


class VoteRequest(BaseModel):
    chatId: UUID
    messageId: UUID
    type: str  # "up" or "down"


@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    # current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all votes for a specific chat.
    """
    # Validate chat exists and belongs to user
    chat = await get_chat_by_id(db, chatId)
    if not chat:
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    # if str(chat.user_id) != current_user["id"]:
    #     raise ChatSDKError("forbidden:vote", status_code=status.HTTP_403_FORBIDDEN)

    # Get votes
    votes = await get_votes_by_chat_id(db, chatId)
    return votes


@router.patch("")
async def vote(
    request: VoteRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Vote on a message (upvote or downvote).
    """
    # Validate request
    if request.type not in ["up", "down"]:
        raise ChatSDKError(
            "bad_request:api",
            "Type must be 'up' or 'down'",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate chat exists and belongs to user
    chat = await get_chat_by_id(db, request.chatId)
    if not chat:
        raise ChatSDKError("not_found:vote", status_code=status.HTTP_404_NOT_FOUND)

    if str(chat.user_id) != current_user["id"]:
        raise ChatSDKError("forbidden:vote", status_code=status.HTTP_403_FORBIDDEN)

    # Vote on message
    await vote_message(db, request.chatId, request.messageId, request.type)

    return {"status": "voted"}
