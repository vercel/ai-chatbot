from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chat_queries import delete_all_chats_by_user_id, get_chats_by_user_id
from app.utils.user_id import get_user_id_uuid

router = APIRouter()


@router.get("")
async def get_chat_history(
    limit: int = Query(10, ge=1, le=100),
    starting_after: Optional[UUID] = None,
    ending_before: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get chat history for the current user.
    Supports pagination with starting_after or ending_before.
    Returns: { chats: List[Chat], hasMore: bool }
    """
    if starting_after and ending_before:
        raise ChatSDKError(
            "bad_request:api",
            "Only one of starting_after or ending_before can be provided",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Convert user_id to UUID (handles session IDs when auth is disabled)
    user_id = get_user_id_uuid(current_user["id"])

    # Get chats
    result = await get_chats_by_user_id(
        db, user_id, limit=limit, starting_after=starting_after, ending_before=ending_before
    )

    # Convert Chat objects to dict format matching frontend expectations
    chats = [
        {
            "id": str(chat.id),
            "title": chat.title,
            "createdAt": chat.createdAt.isoformat(),
            "visibility": chat.visibility,
            "userId": str(chat.userId),
            "lastContext": chat.lastContext,
        }
        for chat in result["chats"]
    ]

    return {"chats": chats, "hasMore": result["hasMore"]}


@router.delete("")
async def delete_all_chats(
    current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Delete all chats for the current user.
    Returns: { deletedCount: int }
    """
    # Convert user_id to UUID (handles session IDs when auth is disabled)
    user_id = get_user_id_uuid(current_user["id"])

    # Delete all chats
    result = await delete_all_chats_by_user_id(db, user_id)

    return result
