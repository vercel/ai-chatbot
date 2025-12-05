import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Chat(Base):
    __tablename__ = "Chat"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)  # noqa: N815
    title = Column(String, nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False)  # noqa: N815
    visibility = Column(String, nullable=False, default="private")
    lastContext = Column(JSONB, nullable=True)  # noqa: N815

    # Relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat")
    votes = relationship("Vote", back_populates="chat")
