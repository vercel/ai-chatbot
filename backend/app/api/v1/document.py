from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

from app.api.deps import get_current_user
from app.core.database import get_db

router = APIRouter()


class DocumentRequest(BaseModel):
    content: str
    title: str
    kind: str  # ArtifactKind


@router.get("")
async def get_document(
    id: UUID = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a document by ID.
    """
    # TODO: Implement document retrieval
    # documents = await get_documents_by_id(db, id)
    # if not documents:
    #     raise HTTPException(status_code=404, detail="Document not found")
    # if documents[0].user_id != current_user["id"]:
    #     raise HTTPException(status_code=403, detail="Forbidden")

    return []


@router.post("")
async def create_document(
    id: UUID = Query(...),
    request: DocumentRequest = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create or update a document.
    """
    # TODO: Implement document creation
    # document = await save_document(
    #     db, id, request.content, request.title, request.kind, current_user["id"]
    # )

    return {"id": str(id), "status": "created"}


@router.delete("")
async def delete_document(
    id: UUID = Query(...),
    timestamp: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete documents after a specific timestamp.
    """
    # TODO: Implement document deletion
    # if not timestamp:
    #     raise HTTPException(status_code=400, detail="Timestamp required")
    # documents = await get_documents_by_id(db, id)
    # if documents[0].user_id != current_user["id"]:
    #     raise HTTPException(status_code=403, detail="Forbidden")
    # deleted = await delete_documents_by_id_after_timestamp(db, id, timestamp)

    return {"deleted": 0}

