"""Utilities for handling file operations in chat messages."""

import base64
import logging
import re
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File

logger = logging.getLogger(__name__)


def extract_file_id_from_url(url: str) -> Optional[UUID]:
    """Extract file ID from URL like /api/files/{file_id}."""
    if not url:
        return None

    # Match pattern: /api/files/{uuid}
    pattern = r"/api/files/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
    match = re.search(pattern, url, re.IGNORECASE)
    if match:
        try:
            return UUID(match.group(1))
        except ValueError:
            return None
    return None


async def get_file_base64(file_id: UUID, content_type: str, db: AsyncSession) -> Optional[str]:
    """Fetch file from database and return base64-encoded data URL."""
    try:
        result = await db.execute(select(File).where(File.id == file_id))
        file_record = result.scalar_one_or_none()

        if not file_record:
            logger.warning("File not found in database: %s", file_id)
            return None

        # Encode file data as base64
        file_data_bytes = bytes(file_record.data)
        base64_string = base64.b64encode(file_data_bytes).decode("utf-8")

        # Return data URL format: data:{content_type};base64,{base64_string}
        return f"data:{content_type};base64,{base64_string}"
    except Exception as e:
        logger.error("Error fetching file from database: %s", e)
        return None
