import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.config import settings
from app.db import get_db
from app.limiter import limiter
from app.models.document import Document
from app.models.schemas import (
    DocumentOut,
    DocumentDetail,
    SummarizeResponse,
    DeleteResponse,
    DemoLimitsResponse,
)
from app.services.ai_service import summarize_document, get_embeddings
from app.services.document_service import create_document_record, process_document
from app.services.usage_limiter import (
    check_and_increment_usage,
    get_usage_status,
    get_visitor_key,
)
from app.services.vector_store import delete_document_vectors
from app.utils.file_handler import save_uploaded_file, validate_file_type, remove_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/demo-limits", response_model=DemoLimitsResponse)
def get_demo_limits(request: Request, db: Session = Depends(get_db)):
    return DemoLimitsResponse(
        upload=get_usage_status(
            db=db,
            action="upload",
            visitor_key=get_visitor_key(request),
            global_limit=settings.daily_upload_limit,
            per_visitor_limit=settings.per_ip_upload_limit,
        )
    )


@router.post("/upload", response_model=DocumentOut, status_code=201)
@limiter.limit("3/10minutes")
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    validate_file_type(file.filename)
    if settings.demo_mode:
        check_and_increment_usage(
            db=db,
            action="upload",
            visitor_key=get_visitor_key(request),
            global_limit=settings.daily_upload_limit,
            per_visitor_limit=settings.per_ip_upload_limit,
        )

    file_path, filename = await save_uploaded_file(file)
    logger.info("File saved: %s", file_path)

    doc = create_document_record(db=db, filename=filename, file_path=file_path)
    background_tasks.add_task(process_document, doc.id)

    return doc


@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", response_model=DeleteResponse)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == "processing":
        raise HTTPException(status_code=409, detail="Document is still processing")

    file_path = doc.file_path
    delete_document_vectors(document_id, get_embeddings())
    remove_file(file_path)

    db.delete(doc)
    db.commit()

    logger.info("Document deleted: %s", document_id)
    return {"message": "Document deleted"}


@router.post("/{document_id}/summarize", response_model=SummarizeResponse)
@limiter.limit("2/10minutes")
async def trigger_summarize(
    request: Request,
    document_id: str,
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == "failed":
        raise HTTPException(status_code=422, detail="Cannot summarize a failed document")
    if doc.status == "processing":
        raise HTTPException(status_code=409, detail="Document is still processing")
    if settings.demo_mode:
        check_and_increment_usage(
            db=db,
            action="summary",
            visitor_key=get_visitor_key(request),
            global_limit=settings.daily_summary_limit,
            per_visitor_limit=settings.per_ip_summary_limit,
        )

    summary = await summarize_document(doc)
    doc.summary = summary
    doc.status = "summarized"
    db.commit()

    return SummarizeResponse(summary=summary)


@router.get("/{document_id}/summary", response_model=SummarizeResponse)
def get_summary(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated")
    return SummarizeResponse(summary=doc.summary)
