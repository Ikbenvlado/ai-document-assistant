from datetime import date, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.document import Document, UsageLedger
from app.models.schemas import (
    AdminActionStats,
    AdminDailyUsage,
    AdminFileTypeStats,
    AdminStatsResponse,
    AdminStatusStats,
)
from app.services.usage_limiter import GLOBAL_SCOPE

router = APIRouter(prefix="/admin", tags=["admin"])
TRACKED_ACTIONS = ("upload", "delete", "chat", "summary")


def require_admin(x_admin_password: str = Header(default="")) -> None:
    if not settings.admin_password:
        raise HTTPException(status_code=503, detail="Admin panel is not configured")
    if x_admin_password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
):
    today = date.today()
    actions = [
        AdminActionStats(
            action=action,
            today=_usage_count(db, action, today),
            total=_usage_total(db, action),
        )
        for action in TRACKED_ACTIONS
    ]

    status_rows = (
        db.query(Document.status, func.count(Document.id))
        .group_by(Document.status)
        .order_by(Document.status)
        .all()
    )
    file_type_rows = (
        db.query(Document.file_type, func.count(Document.id))
        .group_by(Document.file_type)
        .order_by(Document.file_type)
        .all()
    )

    return AdminStatsResponse(
        documents_total=db.query(Document).count(),
        actions=actions,
        statuses=[
            AdminStatusStats(status=status or "unknown", count=count)
            for status, count in status_rows
        ],
        file_types=[
            AdminFileTypeStats(file_type=file_type or "unknown", count=count)
            for file_type, count in file_type_rows
        ],
        recent_usage=_recent_usage(db, today),
    )


def _usage_count(db: Session, action: str, usage_date: date) -> int:
    return (
        db.query(UsageLedger.count)
        .filter(
            UsageLedger.usage_date == usage_date,
            UsageLedger.action == action,
            UsageLedger.client_ip == GLOBAL_SCOPE,
        )
        .scalar()
        or 0
    )


def _usage_total(db: Session, action: str) -> int:
    return (
        db.query(func.coalesce(func.sum(UsageLedger.count), 0))
        .filter(
            UsageLedger.action == action,
            UsageLedger.client_ip == GLOBAL_SCOPE,
        )
        .scalar()
        or 0
    )


def _recent_usage(db: Session, today: date) -> list[AdminDailyUsage]:
    start_date = today - timedelta(days=6)
    rows = (
        db.query(UsageLedger.usage_date, UsageLedger.action, UsageLedger.count)
        .filter(
            UsageLedger.usage_date >= start_date,
            UsageLedger.client_ip == GLOBAL_SCOPE,
            UsageLedger.action.in_(TRACKED_ACTIONS),
        )
        .all()
    )

    by_date = {
        (start_date + timedelta(days=offset)).isoformat(): {
            "upload": 0,
            "delete": 0,
            "chat": 0,
            "summary": 0,
        }
        for offset in range(7)
    }
    for usage_date, action, count in rows:
        key = usage_date.isoformat()
        if key in by_date and action in by_date[key]:
            by_date[key][action] = count

    return [
        AdminDailyUsage(usage_date=usage_date, **counts)
        for usage_date, counts in by_date.items()
    ]
