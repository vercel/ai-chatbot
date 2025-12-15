from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import PrimaryKeyConstraint

from app.core.database import Base


# ruff: noqa: N815
class Vote(Base):
    __tablename__ = "Vote_v2"
    __table_args__ = (PrimaryKeyConstraint("chatId", "messageId"),)

    chatId = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=False, primary_key=True)
    messageId = Column(
        UUID(as_uuid=True), ForeignKey("Message_v2.id"), nullable=False, primary_key=True
    )
    isUpvoted = Column(Boolean, nullable=True)
    feedback = Column(String, nullable=True)
    # General timestamps (for backward compatibility)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)  # noqa: N815
    updatedAt = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)  # noqa: N815
    # Separate timestamps for vote and feedback tracking
    voteCreatedAt = Column(DateTime, nullable=True)  # noqa: N815
    voteUpdatedAt = Column(DateTime, nullable=True)  # noqa: N815
    feedbackCreatedAt = Column(DateTime, nullable=True)  # noqa: N815
    feedbackUpdatedAt = Column(DateTime, nullable=True)  # noqa: N815

    # Relationships
    chat = relationship("Chat", back_populates="votes")
    message = relationship("Message", back_populates="votes")
