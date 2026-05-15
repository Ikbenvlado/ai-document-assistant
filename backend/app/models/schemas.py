from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    text_preview: str | None
    summary: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetail(DocumentOut):
    full_text: str | None = None


class SummarizeResponse(BaseModel):
    summary: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class DeleteResponse(BaseModel):
    message: str


class UsageStatus(BaseModel):
    used: int
    limit: int
    remaining: int
    reached: bool


class DemoLimitsResponse(BaseModel):
    upload: UsageStatus


class AdminActionStats(BaseModel):
    action: str
    today: int
    total: int


class AdminStatusStats(BaseModel):
    status: str
    count: int


class AdminFileTypeStats(BaseModel):
    file_type: str
    count: int


class AdminDailyUsage(BaseModel):
    usage_date: str
    upload: int = 0
    delete: int = 0
    chat: int = 0
    summary: int = 0


class AdminStatsResponse(BaseModel):
    documents_total: int
    actions: list[AdminActionStats]
    statuses: list[AdminStatusStats]
    file_types: list[AdminFileTypeStats]
    recent_usage: list[AdminDailyUsage]
