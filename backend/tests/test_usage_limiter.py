from fastapi import HTTPException
from starlette.datastructures import Headers
import pytest

from app.services.usage_limiter import (
    check_and_increment_usage,
    get_usage_status,
    get_visitor_key,
)


def test_check_and_increment_usage_allows_until_limits(db_session):
    check_and_increment_usage(
        db=db_session,
        action="chat",
        client_ip="127.0.0.1",
        global_limit=2,
        per_ip_limit=2,
    )

    check_and_increment_usage(
        db=db_session,
        action="chat",
        client_ip="127.0.0.1",
        global_limit=2,
        per_ip_limit=2,
    )


def test_check_and_increment_usage_blocks_per_ip_limit(db_session):
    check_and_increment_usage(
        db=db_session,
        action="summary",
        client_ip="127.0.0.1",
        global_limit=10,
        per_ip_limit=1,
    )

    with pytest.raises(HTTPException) as exc:
        check_and_increment_usage(
            db=db_session,
            action="summary",
            client_ip="127.0.0.1",
            global_limit=10,
            per_ip_limit=1,
        )

    assert exc.value.status_code == 429
    assert "Daily demo limit reached" in exc.value.detail


def test_check_and_increment_usage_blocks_global_limit(db_session):
    check_and_increment_usage(
        db=db_session,
        action="upload",
        client_ip="127.0.0.1",
        global_limit=1,
        per_ip_limit=10,
    )

    with pytest.raises(HTTPException) as exc:
        check_and_increment_usage(
            db=db_session,
            action="upload",
            client_ip="127.0.0.2",
            global_limit=1,
            per_ip_limit=10,
        )

    assert exc.value.status_code == 429
    assert "Daily demo limit reached" in exc.value.detail


class FakeRequest:
    def __init__(self, headers: dict[str, str], host: str):
        self.headers = Headers(headers)
        self.client = type("Client", (), {"host": host})()


def test_get_visitor_key_prefers_forwarded_ip():
    request = FakeRequest({"x-forwarded-for": "203.0.113.10, 10.0.0.1"}, "127.0.0.1")

    assert get_visitor_key(request) == "203.0.113.10"


def test_get_visitor_key_falls_back_to_client_host():
    request = FakeRequest({}, "127.0.0.1")

    assert get_visitor_key(request) == "127.0.0.1"


def test_get_usage_status_reports_remaining_uploads(db_session):
    check_and_increment_usage(
        db=db_session,
        action="upload",
        visitor_key="visitor-1",
        global_limit=20,
        per_visitor_limit=2,
    )

    status = get_usage_status(
        db=db_session,
        action="upload",
        visitor_key="visitor-1",
        global_limit=20,
        per_visitor_limit=2,
    )

    assert status == {
        "used": 1,
        "limit": 2,
        "remaining": 1,
        "reached": False,
    }


def test_get_usage_status_marks_reached_when_visitor_limit_is_used(db_session):
    for _ in range(2):
        check_and_increment_usage(
            db=db_session,
            action="upload",
            visitor_key="visitor-1",
            global_limit=20,
            per_visitor_limit=2,
        )

    status = get_usage_status(
        db=db_session,
        action="upload",
        visitor_key="visitor-1",
        global_limit=20,
        per_visitor_limit=2,
    )

    assert status["used"] == 2
    assert status["remaining"] == 0
    assert status["reached"] is True
