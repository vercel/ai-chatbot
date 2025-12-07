"""Background task helpers for chat streaming."""

import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import BackgroundTasks

from app.core.database import AsyncSessionLocal
from app.db.queries.chat_queries import (
    save_messages,
    update_chat_last_context_by_id,
)

logger = logging.getLogger(__name__)


def create_save_messages_task(
    background_tasks: BackgroundTasks,
    chat_id: UUID,
    messages: List[Dict[str, Any]],
) -> None:
    """Schedule a background task to save assistant messages."""
    if not messages:
        logger.warning("No assistant messages to save for chat %s", chat_id)
        return

    logger.info(
        "Scheduling save of %d assistant message(s) for chat %s",
        len(messages),
        chat_id,
    )

    # Create a copy of the list for the background task
    messages_copy = messages.copy()

    async def save_messages_task():
        async with AsyncSessionLocal() as session:
            await save_messages(session, messages_copy)

    background_tasks.add_task(save_messages_task)


def create_update_context_task(
    background_tasks: BackgroundTasks,
    chat_id: UUID,
    usage: Dict[str, Any],
) -> None:
    """Schedule a background task to update chat context with usage."""
    if not usage:
        return

    async def update_context_task():
        async with AsyncSessionLocal() as session:
            await update_chat_last_context_by_id(session, chat_id, usage)

    background_tasks.add_task(update_context_task)
