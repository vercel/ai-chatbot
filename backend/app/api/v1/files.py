from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from app.api.deps import get_current_user
from app.core.database import get_db
from app.config import settings

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file (image) to Vercel Blob storage.
    Max file size: 5MB
    Supported types: JPEG, PNG
    """
    # Validate file size (5MB max)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size should be less than 5MB"
        )

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="File type should be JPEG or PNG"
        )

    # Upload to Vercel Blob
    if not settings.BLOB_READ_WRITE_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Blob storage not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"https://blob.vercel-storage.com/{file.filename}",
                content=file_content,
                headers={
                    "Authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                    "Content-Type": file.content_type or "application/octet-stream"
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail="Upload failed"
            )

        data = response.json()
        return {
            "url": data.get("url"),
            "pathname": data.get("pathname"),
            "contentType": file.content_type
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )

