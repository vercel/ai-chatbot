from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from datetime import datetime
import uuid


class Stream(Base):
    __tablename__ = "Stream"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chatId = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
