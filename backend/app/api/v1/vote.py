import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import get_chat_by_id
from app.db.queries.vote_queries import get_votes_by_chat_id, vote_message
from app.utils.user_id import get_user_id_uuid, user_ids_match

logger = logging.getLogger(__name__)
# Ensure logger level is set (in case module is imported before main.py configures logging)
if not logger.handlers:
    logger.setLevel(logging.INFO)

router = APIRouter()


# ruff: noqa: N815
class VoteRequest(BaseModel):
    chatId: UUID
    messageId: UUID
    type: str  # "up" or "down"


# ruff: noqa: N803
@router.get("")
async def get_votes(
    chatId: UUID = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all votes for a specific chat.
    """
    logger.info("=== GET /api/vote called ===")
    logger.info("chatId=%s, current_user_id=%s", chatId, current_user.get("id"))

    # Validate chat exists
    chat = await get_chat_by_id(db, chatId)
    if not chat:
        logger.warning("Chat not found: %s", chatId)
        raise ChatSDKError("not_found:chat", status_code=status.HTTP_404_NOT_FOUND)

    logger.info(
        "Chat found: id=%s, userId=%s (type=%s), visibility=%s",
        chat.id,
        chat.userId,
        type(chat.userId).__name__,
        chat.visibility,
    )

    # Check ownership based on visibility:
    # - Public chats: Anyone can vote (no ownership check)
    # - Private chats: Only the owner can vote (enforce ownership)
    if chat.visibility == "private":
        current_user_id_uuid = get_user_id_uuid(current_user["id"])
        logger.info(
            "Checking ownership: current_user_id=%s (uuid=%s) vs chat.userId=%s (uuid type)",
            current_user["id"],
            current_user_id_uuid,
            chat.userId,
        )
        logger.info(
            "UUID comparison: %s == %s = %s",
            current_user_id_uuid,
            chat.userId,
            current_user_id_uuid == chat.userId,
        )
        if not user_ids_match(current_user["id"], chat.userId):
            logger.warning(
                "Vote access denied: current_user_id=%s (uuid=%s), chat.userId=%s, visibility=%s",
                current_user["id"],
                current_user_id_uuid,
                chat.userId,
                chat.visibility,
            )
            raise ChatSDKError("forbidden:vote", status_code=status.HTTP_403_FORBIDDEN)

    logger.info("Access granted, fetching votes for chat %s", chatId)

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

    # Validate chat exists
    chat = await get_chat_by_id(db, request.chatId)
    if not chat:
        raise ChatSDKError("not_found:vote", status_code=status.HTTP_404_NOT_FOUND)

    # Check ownership based on visibility:
    # - Public chats: Anyone can vote (no ownership check)
    # - Private chats: Only the owner can vote (enforce ownership)
    if chat.visibility == "private":
        current_user_id_uuid = get_user_id_uuid(current_user["id"])
        if not user_ids_match(current_user["id"], chat.userId):
            logger.warning(
                "Vote access denied: current_user_id=%s (uuid=%s), chat.userId=%s, visibility=%s",
                current_user["id"],
                current_user_id_uuid,
                chat.userId,
                chat.visibility,
            )
            raise ChatSDKError("forbidden:vote", status_code=status.HTTP_403_FORBIDDEN)

    # Vote on message
    await vote_message(db, request.chatId, request.messageId, request.type)

    return {"status": "voted"}
