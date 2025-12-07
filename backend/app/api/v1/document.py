from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.document_queries import (
    delete_documents_by_id_after_timestamp,
    get_documents_by_id,
    save_document,
)
from app.db.queries.user_queries import get_or_create_user_for_session
from app.utils.user_id import get_user_id_uuid, is_session_id, user_ids_match

router = APIRouter()


class DocumentRequest(BaseModel):
    content: str
    title: str
    kind: str  # "text", "code", "image", "sheet"


@router.get("")
async def get_document(
    id: UUID = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all versions of a document by ID.
    Returns an array of document versions ordered by creation time.
    """
    documents = await get_documents_by_id(db, id)

    if not documents:
        raise ChatSDKError("not_found:document", status_code=status.HTTP_404_NOT_FOUND)

    # Check ownership (all versions should belong to the same user)
    if not user_ids_match(current_user["id"], documents[0].user_id):
        raise ChatSDKError("forbidden:document", status_code=status.HTTP_403_FORBIDDEN)

    # Convert to dict format matching frontend expectations
    return [
        {
            "id": str(doc.id),
            "createdAt": doc.created_at.isoformat(),
            "title": doc.title,
            "content": doc.content,
            "kind": doc.kind,
            "userId": str(doc.user_id),
        }
        for doc in documents
    ]


@router.post("")
async def create_document(
    id: UUID = Query(...),
    request: DocumentRequest = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new version of a document.
    Creates a new document record with the same ID but a new timestamp.
    """
    if not request:
        raise ChatSDKError(
            "bad_request:api", "Request body is required", status_code=status.HTTP_400_BAD_REQUEST
        )

    # Validate kind enum
    valid_kinds = ["text", "code", "image", "sheet"]
    if request.kind not in valid_kinds:
        raise ChatSDKError(
            "bad_request:api",
            f"Kind must be one of: {', '.join(valid_kinds)}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Check if document exists and user owns it
    existing_documents = await get_documents_by_id(db, id)
    if existing_documents:
        if not user_ids_match(current_user["id"], existing_documents[0].user_id):
            raise ChatSDKError("forbidden:document", status_code=status.HTTP_403_FORBIDDEN)

    # Create new version
    user_id = get_user_id_uuid(current_user["id"])

    # Ensure user exists in database (required for foreign key constraint)
    # When auth is disabled, session IDs need corresponding user records
    if settings.DISABLE_AUTH or is_session_id(current_user["id"]):
        await get_or_create_user_for_session(db, user_id)
    document = await save_document(
        db,
        document_id=id,
        title=request.title,
        kind=request.kind,
        content=request.content,
        user_id=user_id,
    )

    # Convert to dict format matching frontend expectations
    return {
        "id": str(document.id),
        "createdAt": document.created_at.isoformat(),
        "title": document.title,
        "content": document.content,
        "kind": document.kind,
        "userId": str(document.user_id),
    }


@router.delete("")
async def delete_document(
    id: UUID = Query(...),
    timestamp: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete all document versions after a specific timestamp.
    """
    if not timestamp:
        raise ChatSDKError(
            "bad_request:api",
            "Parameter timestamp is required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Parse timestamp
    try:
        timestamp_dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        raise ChatSDKError(
            "bad_request:api",
            "Invalid timestamp format. Use ISO 8601 format.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Check if document exists and user owns it
    documents = await get_documents_by_id(db, id)
    if not documents:
        raise ChatSDKError("not_found:document", status_code=status.HTTP_404_NOT_FOUND)

    if not user_ids_match(current_user["id"], documents[0].user_id):
        raise ChatSDKError("forbidden:document", status_code=status.HTTP_403_FORBIDDEN)

    # Delete documents after timestamp
    deleted_documents = await delete_documents_by_id_after_timestamp(db, id, timestamp_dt)

    # Convert to dict format matching frontend expectations
    return [
        {
            "id": str(doc.id),
            "createdAt": doc.created_at.isoformat(),
            "title": doc.title,
            "content": doc.content,
            "kind": doc.kind,
            "userId": str(doc.user_id),
        }
        for doc in deleted_documents
    ]
