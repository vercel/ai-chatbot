"""
SQLAlchemy model for the Suggestion table.
Ported from lib/db/schema.ts
"""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import PrimaryKeyConstraint, ForeignKeyConstraint

from app.core.database import Base


class Suggestion(Base):
    __tablename__ = "Suggestion"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(
        PG_UUID(as_uuid=True),
        name="documentId",
        nullable=False,
    )
    document_created_at = Column(
        DateTime,
        name="documentCreatedAt",
        nullable=False,
    )
    original_text = Column(Text, name="originalText", nullable=False)
    suggested_text = Column(Text, name="suggestedText", nullable=False)
    description = Column(Text, nullable=True)
    is_resolved = Column(Boolean, name="isResolved", nullable=False, default=False)
    user_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("User.id"),
        name="userId",
        nullable=False,
    )
    created_at = Column(DateTime, name="createdAt", nullable=False, default=datetime.utcnow)

    # Composite foreign key to Document (id, createdAt)
    __table_args__ = (
        ForeignKeyConstraint(
            ["documentId", "documentCreatedAt"],
            ["Document.id", "Document.createdAt"],
            name="fk_suggestion_document",
        ),
    )

    # Relationships
    user = relationship("User", back_populates="suggestions")

