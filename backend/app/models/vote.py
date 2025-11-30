from sqlalchemy import Column, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.schema import PrimaryKeyConstraint
from app.core.database import Base


class Vote(Base):
    __tablename__ = "Vote_v2"
    __table_args__ = (PrimaryKeyConstraint("chatId", "messageId"),)

    chatId = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=False, primary_key=True)
    messageId = Column(
        UUID(as_uuid=True), ForeignKey("Message_v2.id"), nullable=False, primary_key=True
    )
    isUpvoted = Column(Boolean, nullable=False)

    # Relationships
    chat = relationship("Chat", back_populates="votes")
