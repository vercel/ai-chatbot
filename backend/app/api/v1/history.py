from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db

router = APIRouter()


@router.get("")
async def get_chat_history(
    limit: int = Query(10, ge=1, le=100),
    starting_after: Optional[UUID] = None,
    ending_before: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get chat history for the current user.
    Supports pagination with starting_after or ending_before.
    """
    if starting_after and ending_before:
        raise HTTPException(
            status_code=400,
            detail="Only one of starting_after or ending_before can be provided"
        )

    # TODO: Implement database query
    # chats = await get_chats_by_user_id(
    #     db,
    #     current_user["id"],
    #     limit=limit,
    #     starting_after=starting_after,
    #     ending_before=ending_before
    # )

    # Placeholder response
    return []


@router.delete("")
async def delete_all_chats(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all chats for the current user.
    """
    # TODO: Implement deletion
    # result = await delete_all_chats_by_user_id(db, current_user["id"])

    return {"deleted": 0}

