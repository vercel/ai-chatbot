"""Internal client implementation."""

from collections.abc import AsyncIterable, AsyncIterator
from typing import Any

from ..sdk_types import (
    ClaudeCodeOptions,
    Message,
)
from .message_parser import parse_message
from .transport import Transport
from .transport.subprocess_cli import SubprocessCLITransport


class InternalClient:
    """Internal client implementation."""

    def __init__(self) -> None:
        """Initialize the internal client."""

    async def process_query(
        self,
        prompt: str | AsyncIterable[dict[str, Any]],
        options: ClaudeCodeOptions,
        transport: Transport | None = None,
    ) -> AsyncIterator[Message]:
        """Process a query through transport."""

        # Use provided transport or choose one based on configuration
        if transport is not None:
            chosen_transport = transport
        else:
            chosen_transport = SubprocessCLITransport(
                prompt=prompt, options=options, close_stdin_after_prompt=True
            )

        try:
            await chosen_transport.connect()

            async for data in chosen_transport.receive_messages():
                yield parse_message(data)

        finally:
            await chosen_transport.disconnect()
