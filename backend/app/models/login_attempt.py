"""
Model for tracking failed login attempts.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class LoginAttempt(Base):
    """
    Tracks failed login attempts for account lockout protection.
    """

    __tablename__ = "LoginAttempt"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False)  # IPv6 max length is 45
    attempted_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", backref="login_attempts")
