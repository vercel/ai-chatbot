"""
Model for tracking revoked JWT tokens.
Used for token revocation and preventing token reuse.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class RevokedToken(Base):
    """
    Tracks revoked JWT tokens by their JWT ID (jti claim).
    Tokens are revoked when users logout or when security events occur.
    """

    __tablename__ = "RevokedToken"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti = Column(String(255), nullable=False, unique=True, index=True)  # JWT ID claim
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # User who owns the token
    revoked_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)  # Token expiration time
