"""Transport implementations for Claude SDK."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any


class Transport(ABC):
    """Abstract transport for Claude communication.

    WARNING: This internal API is exposed for custom transport implementations
    (e.g., remote Claude Code connections). The Claude Code team may change or
    or remove this abstract class in any future release. Custom implementations
    must be updated to match interface changes.
    """

    @abstractmethod
    async def connect(self) -> None:
        """Initialize connection."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Close connection."""
        pass

    @abstractmethod
    async def send_request(
        self, messages: list[dict[str, Any]], options: dict[str, Any]
    ) -> None:
        """Send request to Claude."""
        pass

    @abstractmethod
    def receive_messages(self) -> AsyncIterator[dict[str, Any]]:
        """Receive messages from Claude."""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if transport is connected."""
        pass


__all__ = ["Transport"]
