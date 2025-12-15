import uuid

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "User"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(64), nullable=True)
    type = Column(String(10), nullable=False, default="regular")  # "guest" or "regular"
    password_changed_at = Column(
        DateTime, nullable=True
    )  # Timestamp when password was last changed (for session invalidation)

    # Relationships
    chats = relationship("Chat", back_populates="user")
    documents = relationship("Document", back_populates="user")
    suggestions = relationship("Suggestion", back_populates="user")
    files = relationship("File", back_populates="user")
