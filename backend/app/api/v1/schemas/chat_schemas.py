"""Pydantic models for chat streaming API."""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class MessagePart(BaseModel):
    """A part of a chat message (text or file)."""

    type: str  # "text" or "file"
    text: Optional[str] = None
    mediaType: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None


class ChatMessage(BaseModel):
    """A chat message with parts."""

    id: UUID
    role: str  # "user" or "assistant"
    parts: List[MessagePart]


# ruff: noqa: N815
class StreamRequest(BaseModel):
    """Request model for chat streaming endpoint."""

    id: UUID
    message: ChatMessage
    selectedChatModel: str  # "chat-model" or "chat-model-reasoning"
    selectedVisibilityType: str  # "public" or "private"
    existingMessages: List[Dict[str, Any]] = []
