from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db

router = APIRouter()


class VoteRequest(BaseModel):
    chatId: UUID
    messageId: UUID
    type: str  # "up" or "down"


@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all votes for a specific chat.
    """
    # TODO: Implement vote retrieval
    # chat = await get_chat_by_id(db, chatId)
    # if not chat:
    #     raise HTTPException(status_code=404, detail="Chat not found")
    # if chat.user_id != current_user["id"]:
    #     raise HTTPException(status_code=403, detail="Forbidden")
    # votes = await get_votes_by_chat_id(db, chatId)

    return []


@router.patch("")
async def vote(
    request: VoteRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Vote on a message (upvote or downvote).
    """
    # TODO: Implement voting
    # chat = await get_chat_by_id(db, request.chatId)
    # if not chat:
    #     raise HTTPException(status_code=404, detail="Chat not found")
    # if chat.user_id != current_user["id"]:
    #     raise HTTPException(status_code=403, detail="Forbidden")
    # await vote_message(db, request.chatId, request.messageId, request.type)

    return {"status": "voted"}

