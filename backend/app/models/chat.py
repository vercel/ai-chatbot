from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid


class Chat(Base):
    __tablename__ = "Chat"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    title = Column(String, nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False)
    visibility = Column(String, nullable=False, default="private")
    lastContext = Column(JSONB, nullable=True)

    # Relationships
    user = relationship("User", back_populates="chats")
    votes = relationship("Vote", back_populates="chat")
