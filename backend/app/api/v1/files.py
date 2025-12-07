import io
import uuid

from fastapi import APIRouter, Depends, UploadFile, status
from fastapi import File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.models.file import File
from app.utils.user_id import get_user_id_uuid

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a file (image) to PostgreSQL storage.
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
    file_size = len(file_content)
    if file_size > 5 * 1024 * 1024:
        raise ChatSDKError(
            "bad_request:api",
            "File size should be less than 5MB",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ["image/jpeg", "image/png"]:
        raise ChatSDKError(
            "bad_request:api",
            "File type should be JPEG or PNG",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Convert user_id to UUID (handles session IDs when auth is disabled)
        # get_user_id_uuid converts session IDs to deterministic UUIDs
        user_id = None
        if current_user:
            user_id_str = current_user.get("id")
            if user_id_str:
                try:
                    user_id = get_user_id_uuid(user_id_str)
                except ValueError:
                    # Invalid user ID format - set to None since File.user_id is nullable
                    user_id = None

        # Store file in PostgreSQL
        file_record = File(
            id=uuid.uuid4(),
            filename=file.filename,
            content_type=content_type,
            data=file_content,  # BYTEA column stores binary data
            size=file_size,
            user_id=user_id,
        )

        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)

        # Generate URL for the file (using the file ID)
        # The frontend will need to call GET /api/files/{file_id} to retrieve it
        # Using relative URL so frontend can handle routing
        file_url = f"/api/files/{file_record.id}"

        # Return format matching Vercel Blob API response (for compatibility)
        # Frontend expects: { url, pathname, contentType }
        # - url: Used in <img src={url}> (relative URL works with Next.js Image)
        # - pathname: Used as the attachment name (should be original filename)
        # - contentType: MIME type for the file
        return {
            "url": file_url,
            "pathname": file_record.filename,  # Original filename, not UUID
            "contentType": file_record.content_type,
        }
    except Exception as e:
        await db.rollback()
        raise ChatSDKError(
            "offline:api",
            f"Upload failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/{file_id}")
async def get_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a file by ID from PostgreSQL storage.
    """
    try:
        result = await db.execute(select(File).where(File.id == file_id))
        file_record = result.scalar_one_or_none()

        if not file_record:
            raise ChatSDKError(
                "not_found:api",
                "File not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Return file as streaming response (chunked for better memory efficiency)
        # Create a BytesIO object from the file data
        file_stream = io.BytesIO(bytes(file_record.data))

        async def generate():
            # Read and yield file in chunks (64KB at a time)
            chunk_size = 64 * 1024  # 64KB chunks
            while True:
                chunk = file_stream.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        return StreamingResponse(
            generate(),
            media_type=file_record.content_type,
            headers={
                "Content-Disposition": f'inline; filename="{file_record.filename}"',
                "Content-Length": str(file_record.size),
            },
        )
    except ChatSDKError:
        raise
    except Exception as e:
        raise ChatSDKError(
            "offline:api",
            f"Failed to retrieve file: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
