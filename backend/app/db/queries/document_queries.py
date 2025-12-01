from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document


async def get_documents_by_id(
    session: AsyncSession, document_id: UUID
) -> List[Document]:
    """Get all versions of a document by ID, ordered by creation time."""
    result = await session.execute(
        select(Document)
        .where(Document.id == document_id)
        .order_by(Document.created_at)
    )
    return list(result.scalars().all())


async def save_document(
    session: AsyncSession,
    document_id: UUID,
    title: str,
    kind: str,
    content: Optional[str],
    user_id: UUID,
) -> Document:
    """Save a new version of a document (creates new record with new timestamp)."""
    new_document = Document(
        id=document_id,
        title=title,
        kind=kind,
        content=content,
        user_id=user_id,
        created_at=datetime.utcnow(),
    )
    session.add(new_document)
    await session.commit()
    await session.refresh(new_document)
    return new_document


async def delete_documents_by_id_after_timestamp(
    session: AsyncSession, document_id: UUID, timestamp: datetime
) -> List[Document]:
    """
    Delete all document versions after a specific timestamp.
    Returns the deleted documents.
    """
    # First, get the documents that will be deleted
    result = await session.execute(
        select(Document).where(
            and_(
                Document.id == document_id,
                Document.created_at > timestamp,
            )
        )
    )
    documents_to_delete = list(result.scalars().all())

    # Delete the documents
    if documents_to_delete:
        await session.execute(
            delete(Document).where(
                and_(
                    Document.id == document_id,
                    Document.created_at > timestamp,
                )
            )
        )
        await session.commit()

    return documents_to_delete

