import uuid
from datetime import datetime, timedelta

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class PasswordResetToken(Base):
    """
    Stores password reset tokens for secure password reset flow.
    Tokens expire after 1 hour and are single-use.
    """

    __tablename__ = "PasswordResetToken"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("User.id"), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    user = relationship("User", backref="password_reset_tokens")

    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not used)."""
        return not self.used and datetime.utcnow() < self.expires_at

    @staticmethod
    def default_expiry() -> datetime:
        """Get default expiration time (1 hour from now)."""
        return datetime.utcnow() + timedelta(hours=1)
