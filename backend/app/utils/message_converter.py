"""Convert messages from database format to OpenAI format."""

import logging
from typing import Any, Dict, List
from urllib.parse import urljoin, urlparse

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.utils.file_handler import extract_file_id_from_url, get_file_base64

logger = logging.getLogger(__name__)


async def convert_messages_to_openai_format(
    messages: List[Dict[str, Any]], db: AsyncSession
) -> List[Dict[str, Any]]:
    """
    Convert messages from database format to OpenAI format.
    Handles both text and file parts.
    For files stored in our database, uses base64-encoded data instead of URLs.
    """
    openai_messages = []

    for msg in messages:
        role = msg["role"]
        parts = msg.get("parts", [])

        # Build content array for OpenAI format
        content = []
        for part in parts:
            if part.get("type") == "text":
                content.append({"type": "text", "text": part.get("text", "")})
            elif part.get("type") == "file":
                file_url = part.get("url", "")
                file_name = part.get("name", "file")
                media_type = part.get("mediaType") or part.get(
                    "contentType", "application/octet-stream"
                )

                # Determine if this is an image or PDF based on media type
                is_image = media_type.startswith("image/")
                is_pdf = media_type == "application/pdf"

                # Try to extract file ID from URL (our database files)
                file_id = extract_file_id_from_url(file_url)
                if file_id:
                    # File is in our database - use base64 encoding
                    base64_data = await get_file_base64(file_id, db)
                    if base64_data:
                        if is_pdf:
                            # Use file format for PDFs
                            content.append(
                                {
                                    "type": "file",
                                    "file": {
                                        "filename": file_name,
                                        "file_data": base64_data,
                                    },
                                }
                            )
                        elif is_image:
                            # Use image_url format for images (JPEG, PNG, etc.)
                            content.append(
                                {
                                    "type": "image_url",
                                    "image_url": {"url": base64_data},
                                }
                            )
                        else:
                            # Unknown type - default to file format
                            logger.warning("Unknown media type %s, using file format", media_type)
                            content.append(
                                {
                                    "type": "file",
                                    "file": {
                                        "filename": file_name,
                                        "file_data": base64_data,
                                    },
                                }
                            )
                    else:
                        # Fallback to URL if file not found in database
                        logger.warning("File not found, falling back to URL: %s", file_url)
                        # Convert relative URL to absolute URL as fallback
                        parsed = urlparse(file_url)
                        if not (parsed.scheme and parsed.netloc):
                            base_url = settings.NEXTJS_URL.rstrip("/")
                            file_url = urljoin(base_url, file_url)
                        # Use appropriate format based on media type
                        if is_image:
                            content.append(
                                {
                                    "type": "image_url",
                                    "image_url": {"url": file_url},
                                }
                            )
                        else:
                            # For non-images, we can't use URL format with OpenAI
                            # This shouldn't happen if file is in our database
                            logger.error("Cannot use URL format for non-image file: %s", media_type)
                else:
                    # External URL - use appropriate format based on media type
                    parsed = urlparse(file_url)
                    if not (parsed.scheme and parsed.netloc):
                        base_url = settings.NEXTJS_URL.rstrip("/")
                        file_url = urljoin(base_url, file_url)
                    if is_image:
                        content.append(
                            {
                                "type": "image_url",
                                "image_url": {"url": file_url},
                            }
                        )
                    else:
                        # For external non-image files, we can't use URL format
                        logger.warning(
                            "External non-image file URL not supported: %s (%s)",
                            file_url,
                            media_type,
                        )

        if content:
            openai_messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

    return openai_messages
