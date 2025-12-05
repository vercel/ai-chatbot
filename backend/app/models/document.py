import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import PrimaryKeyConstraint

from app.core.database import Base


# ruff: noqa: N815
class Document(Base):
    __tablename__ = "Document"
    __table_args__ = (PrimaryKeyConstraint("id", "createdAt"),)

    id = Column(UUID(as_uuid=True), default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, name="createdAt")
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    kind = Column(
        String, nullable=False, default="text", name="text"
    )  # "text", "code", "image", "sheet"
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False, name="userId")

    # Relationships
    user = relationship("User", back_populates="documents")
