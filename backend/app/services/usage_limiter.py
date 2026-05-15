from datetime import date, datetime, timezone

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import UsageLedger

GLOBAL_SCOPE = "__global__"
DEMO_LIMIT_MESSAGE = "Daily demo limit reached. Please try again tomorrow."


def get_visitor_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def check_and_increment_usage(
    db: Session,
    action: str,
    global_limit: int,
    per_visitor_limit: int | None = None,
    visitor_key: str | None = None,
    client_ip: str | None = None,
    per_ip_limit: int | None = None,
) -> None:
    if visitor_key is None:
        visitor_key = client_ip
    if per_visitor_limit is None:
        per_visitor_limit = per_ip_limit
    if visitor_key is None or per_visitor_limit is None:
        raise ValueError("visitor_key and per_visitor_limit are required")
    if settings.is_demo_limit_exempt(visitor_key):
        return

    today = date.today()
    global_row = _get_or_create_row(db, today, action, GLOBAL_SCOPE)
    visitor_row = _get_or_create_row(db, today, action, visitor_key)

    if global_row.count >= global_limit or visitor_row.count >= per_visitor_limit:
        raise HTTPException(status_code=429, detail=DEMO_LIMIT_MESSAGE)

    now = datetime.now(timezone.utc)
    global_row.count += 1
    global_row.updated_at = now
    visitor_row.count += 1
    visitor_row.updated_at = now
    db.commit()


def record_usage_event(db: Session, action: str, visitor_key: str) -> None:
    today = date.today()
    now = datetime.now(timezone.utc)
    for scope in (GLOBAL_SCOPE, visitor_key):
        row = _get_or_create_row(db, today, action, scope)
        row.count += 1
        row.updated_at = now
    db.commit()


def get_usage_status(
    db: Session,
    action: str,
    visitor_key: str,
    global_limit: int,
    per_visitor_limit: int,
) -> dict[str, int | bool]:
    if settings.is_demo_limit_exempt(visitor_key):
        return {
            "used": 0,
            "limit": per_visitor_limit,
            "remaining": per_visitor_limit,
            "reached": False,
        }

    today = date.today()
    global_count = _get_count(db, today, action, GLOBAL_SCOPE)
    visitor_count = _get_count(db, today, action, visitor_key)
    used = max(global_count - max(global_limit - per_visitor_limit, 0), visitor_count)
    used = min(used, per_visitor_limit)
    remaining = max(per_visitor_limit - used, 0)
    reached = global_count >= global_limit or visitor_count >= per_visitor_limit

    return {
        "used": used,
        "limit": per_visitor_limit,
        "remaining": remaining,
        "reached": reached,
    }


def _get_count(
    db: Session,
    usage_date: date,
    action: str,
    client_ip: str,
) -> int:
    row = (
        db.query(UsageLedger)
        .filter(
            UsageLedger.usage_date == usage_date,
            UsageLedger.action == action,
            UsageLedger.client_ip == client_ip,
        )
        .first()
    )
    return row.count if row else 0


def _get_or_create_row(
    db: Session,
    usage_date: date,
    action: str,
    client_ip: str,
) -> UsageLedger:
    row = (
        db.query(UsageLedger)
        .filter(
            UsageLedger.usage_date == usage_date,
            UsageLedger.action == action,
            UsageLedger.client_ip == client_ip,
        )
        .first()
    )
    if row:
        return row

    row = UsageLedger(
        usage_date=usage_date,
        action=action,
        client_ip=client_ip,
        count=0,
    )
    db.add(row)
    db.flush()
    return row
