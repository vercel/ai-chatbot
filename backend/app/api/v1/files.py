from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.config import settings

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a file (image) to Vercel Blob storage.
    Max file size: 5MB
    Supported types: JPEG, PNG
    """
    # Validate file exists
    if not file.filename:
        raise ChatSDKError(
            "bad_request:api",
            "No file uploaded",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Read file content
    file_content = await file.read()

    # Validate file size (5MB max)
    if len(file_content) > 5 * 1024 * 1024:
        raise ChatSDKError(
            "bad_request:api",
            "File size should be less than 5MB",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise ChatSDKError(
            "bad_request:api",
            "File type should be JPEG or PNG",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Upload to Vercel Blob
    if not settings.BLOB_READ_WRITE_TOKEN:
        raise ChatSDKError(
            "offline:api",
            "Blob storage not configured",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        # Use Vercel Blob API v1
        # The API endpoint is: https://blob.vercel-storage.com
        # Method: PUT
        # Headers: Authorization: Bearer {token}, x-content-type: {content_type}
        # Body: file content (bytes)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                f"https://blob.vercel-storage.com/{file.filename}",
                content=file_content,
                headers={
                    "Authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                    "x-content-type": file.content_type or "application/octet-stream",
                    "x-add-random-suffix": "true",  # Add random suffix to prevent collisions
                },
            )

        if response.status_code not in [200, 201]:
            error_text = response.text
            raise ChatSDKError(
                "offline:api",
                f"Upload failed: {error_text}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = response.json()

        # Return format matching Next.js response
        # The Vercel Blob API returns: { url, pathname, contentType, contentDisposition, size, uploadedAt }
        return {
            "url": data.get("url"),
            "pathname": data.get("pathname"),
            "contentType": data.get("contentType") or file.content_type,
        }
    except ChatSDKError:
        raise
    except Exception as e:
        raise ChatSDKError(
            "offline:api",
            f"Upload failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
