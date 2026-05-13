import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.limiter import limiter
from app.models.document import Document
from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_service import ask_document_question
from app.services.usage_limiter import check_and_increment_usage, get_visitor_key

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["chat"])


@router.post("/{document_id}/chat", response_model=ChatResponse)
@limiter.limit("5/10minutes")
async def chat_with_document(
    request: Request,
    document_id: str,
    body: ChatRequest,
    db: Session = Depends(get_db),
):
    if len(body.question) > settings.demo_max_question_length:
        logger.warning(
            "Prompt too long - document: %s, length: %d",
            document_id,
            len(body.question),
        )
        raise HTTPException(
            status_code=400,
            detail=f"Question too long. Maximum is {settings.demo_max_question_length} characters for the public demo.",
        )

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == "failed":
        raise HTTPException(status_code=422, detail="Cannot chat with a failed document")
    if doc.status == "processing":
        raise HTTPException(status_code=409, detail="Document is still processing")
    if settings.demo_mode:
        check_and_increment_usage(
            db=db,
            action="chat",
            visitor_key=get_visitor_key(request),
            global_limit=settings.daily_chat_limit,
            per_visitor_limit=settings.per_ip_chat_limit,
        )

    answer, sources = await ask_document_question(document_id, body.question)
    return ChatResponse(answer=answer, sources=sources)
