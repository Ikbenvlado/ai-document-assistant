import os
import uuid

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
}


def validate_file_type(filename: str | None) -> None:
    if not filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: .pdf, .txt",
        )


def validate_file_size(content: bytes) -> None:
    max_file_size = settings.demo_max_file_size_mb * 1024 * 1024
    if len(content) > max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.demo_max_file_size_mb} MB for the public demo.",
        )


def validate_mime_type(content_type: str | None) -> None:
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: PDF, TXT",
        )


async def save_uploaded_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename)[1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, unique_name)

    content = await file.read()

    validate_file_size(content)
    validate_mime_type(file.content_type)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path, file.filename or unique_name


def remove_file(file_path: str) -> None:
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
    except OSError:
        pass
