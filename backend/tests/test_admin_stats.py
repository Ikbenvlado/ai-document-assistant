from datetime import date, timedelta

import pytest
from fastapi import HTTPException

from app.config import settings
from app.models.document import Document
from app.models.document import UsageLedger
from app.routes.admin import get_admin_stats, require_admin
from app.services.usage_limiter import GLOBAL_SCOPE


def test_require_admin_rejects_missing_or_wrong_password(monkeypatch):
    monkeypatch.setattr(settings, "admin_password", "secret")

    with pytest.raises(HTTPException) as exc:
        require_admin("")
    assert exc.value.status_code == 401

    with pytest.raises(HTTPException) as exc:
        require_admin("wrong")
    assert exc.value.status_code == 401


def test_require_admin_accepts_configured_password(monkeypatch):
    monkeypatch.setattr(settings, "admin_password", "secret")

    require_admin("secret")


def test_get_admin_stats_returns_usage_and_document_counts(db_session, monkeypatch):
    monkeypatch.setattr(settings, "admin_password", "secret")
    today = date.today()
    yesterday = today - timedelta(days=1)
    db_session.add_all(
        [
            Document(filename="a.pdf", file_path="/tmp/a.pdf", file_type="pdf", status="ready"),
            Document(filename="b.docx", file_path="/tmp/b.docx", file_type="docx", status="failed"),
            UsageLedger(
                usage_date=today,
                action="upload",
                client_ip=GLOBAL_SCOPE,
                count=2,
            ),
            UsageLedger(
                usage_date=yesterday,
                action="chat",
                client_ip=GLOBAL_SCOPE,
                count=5,
            ),
        ]
    )
    db_session.commit()

    stats = get_admin_stats(None, db_session)

    assert stats.documents_total == 2
    assert {item.action: item.today for item in stats.actions}["upload"] == 2
    assert {item.action: item.total for item in stats.actions}["chat"] == 5
    assert {item.status: item.count for item in stats.statuses} == {
        "failed": 1,
        "ready": 1,
    }
    assert {item.file_type: item.count for item in stats.file_types} == {
        "docx": 1,
        "pdf": 1,
    }
