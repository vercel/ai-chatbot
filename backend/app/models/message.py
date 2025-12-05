import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


# ruff: noqa: N815
class Message(Base):
    __tablename__ = "Message_v2"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chatId = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=False)
    role = Column(String, nullable=False)
    parts = Column(JSON, nullable=False)
    attachments = Column(JSON, nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    votes = relationship("Vote", back_populates="message")
