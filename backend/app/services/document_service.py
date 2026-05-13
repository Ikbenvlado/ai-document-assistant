import logging
import os

from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal
from app.models.document import Document

logger = logging.getLogger(__name__)


def create_document_record(
    db: Session,
    filename: str,
    file_path: str,
) -> Document:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    doc = Document(
        filename=filename,
        file_path=file_path,
        file_type=ext,
        text_preview=None,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


def process_document(document_id: str) -> None:
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.warning("Document missing during processing: %s", document_id)
            return

        text_content = extract_text(doc.file_path, doc.file_type)
        if settings.demo_mode:
            text_content = text_content[: settings.demo_max_document_chars]
        doc.text_preview = text_content[:300] if text_content else None
        db.commit()
        db.refresh(doc)

        _index_document_async(doc.id, text_content)

        doc.status = "ready"
        db.commit()
        db.refresh(doc)

        logger.info("Document processed: %s (%s)", doc.id, doc.filename)
    except Exception:
        logger.exception("Processing failed for document %s", document_id)
        if "doc" in locals() and doc:
            doc.status = "failed"
            db.commit()
            _cleanup_file(doc.file_path)
    finally:
        db.close()


def _index_document_async(doc_id: str, text: str) -> None:
    if not text.strip():
        return

    from app.services.ai_service import get_embeddings
    from app.services.vector_store import index_document

    index_document(doc_id, text, get_embeddings())


def extract_text(file_path: str, file_type: str) -> str:
    if file_type == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    from langchain_community.document_loaders import PyPDFLoader

    loader = PyPDFLoader(file_path)
    pages = loader.load()
    return "\n\n".join(page.page_content for page in pages)


def _cleanup_file(file_path: str) -> None:
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
    except OSError:
        pass
