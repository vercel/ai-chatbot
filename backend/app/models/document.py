from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import PrimaryKeyConstraint
from app.core.database import Base
from datetime import datetime
import uuid


class Document(Base):
    __tablename__ = "Document"
    __table_args__ = (PrimaryKeyConstraint("id", "createdAt"),)

    id = Column(UUID(as_uuid=True), default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, name="createdAt")
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    kind = Column(String, nullable=False, default="text", name="text")  # "text", "code", "image", "sheet"
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False, name="userId")

    # Relationships
    user = relationship("User", back_populates="documents")

