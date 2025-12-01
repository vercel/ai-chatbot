"""
Database query functions for Suggestion model.
Ported from lib/db/queries.ts
"""
from datetime import datetime
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.suggestion import Suggestion


async def save_suggestions(
    session: AsyncSession,
    suggestions: List[dict],
) -> List[Suggestion]:
    """
    Save multiple suggestions to the database.

    Args:
        session: Database session
        suggestions: List of suggestion dictionaries with fields:
            - id: UUID
            - documentId: UUID
            - documentCreatedAt: datetime
            - originalText: str
            - suggestedText: str
            - description: str (optional)
            - isResolved: bool (default False)
            - userId: UUID
            - createdAt: datetime

    Returns:
        List of saved Suggestion objects
    """
    new_suggestions = [
        Suggestion(
            id=UUID(sug["id"]),
            document_id=UUID(sug["documentId"]),
            document_created_at=sug["documentCreatedAt"],
            original_text=sug["originalText"],
            suggested_text=sug["suggestedText"],
            description=sug.get("description"),
            is_resolved=sug.get("isResolved", False),
            user_id=UUID(sug["userId"]),
            created_at=sug.get("createdAt", datetime.utcnow()),
        )
        for sug in suggestions
    ]

    session.add_all(new_suggestions)
    await session.commit()

    # Refresh all objects
    for sug in new_suggestions:
        await session.refresh(sug)

    return new_suggestions


async def get_suggestions_by_document_id(
    session: AsyncSession,
    document_id: UUID,
) -> List[Suggestion]:
    """
    Get all suggestions for a document by document ID.

    Args:
        session: Database session
        document_id: Document ID

    Returns:
        List of Suggestion objects
    """
    result = await session.execute(
        select(Suggestion).where(Suggestion.document_id == document_id)
    )
    return list(result.scalars().all())

