from io import BytesIO

import pytest
from fastapi import HTTPException
from pypdf import PdfWriter

from app.utils.file_handler import validate_pdf_readable
from app.utils.file_handler import validate_mime_type


def _pdf_bytes(encrypted: bool = False) -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    if encrypted:
        writer.encrypt("secret")
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def test_validate_pdf_readable_accepts_unlocked_pdf():
    validate_pdf_readable(_pdf_bytes(), ".pdf")


def test_validate_pdf_readable_rejects_password_protected_pdf():
    with pytest.raises(HTTPException) as exc:
        validate_pdf_readable(_pdf_bytes(encrypted=True), ".pdf")

    assert exc.value.status_code == 400
    assert "password protected" in exc.value.detail


def test_validate_pdf_readable_ignores_non_pdf_files():
    validate_pdf_readable(b"plain text", ".txt")


def test_validate_mime_type_accepts_mobile_octet_stream_for_supported_extension():
    validate_mime_type("application/octet-stream", ".pdf")
