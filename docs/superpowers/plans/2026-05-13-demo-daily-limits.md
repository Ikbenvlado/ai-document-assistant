# Demo Daily Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add strict daily demo limits that protect public API credits.

**Architecture:** Store per-day usage rows in SQLite keyed by date, action, and optional IP address. Backend routes enforce global and per-IP limits before expensive operations and frontend displays demo-friendly error messages.

**Tech Stack:** FastAPI, SQLAlchemy, SQLite, Next.js, TypeScript.

---

### Task 1: Backend Settings And Ledger

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/app/models/document.py`
- Create: `backend/app/services/usage_limiter.py`
- Test: `backend/tests/test_usage_limiter.py`

- [ ] Add demo limit settings to `Settings`.
- [ ] Add `UsageLedger` SQLAlchemy model.
- [ ] Implement `check_and_increment_usage`.
- [ ] Add tests for allowed usage and per-IP/global limit failures.

### Task 2: Route Enforcement

**Files:**
- Modify: `backend/app/routes/documents.py`
- Modify: `backend/app/routes/chat.py`
- Modify: `backend/app/utils/file_handler.py`

- [ ] Enforce upload, summary, and chat usage before costly work.
- [ ] Reduce upload size to configured 2 MB.
- [ ] Reduce chat question length to configured 500 characters.

### Task 3: AI Cost Controls

**Files:**
- Modify: `backend/app/services/document_service.py`
- Modify: `backend/app/services/ai_service.py`

- [ ] Truncate extracted text to configured demo character budget before indexing.
- [ ] Reduce LLM `max_tokens`.
- [ ] Reduce retriever `k` to 3.

### Task 4: Frontend Demo Messages

**Files:**
- Modify: `frontend/src/app/upload/page.tsx`
- Modify: `frontend/src/app/documents/[id]/page.tsx`
- Modify: `frontend/src/components/chat/ChatWindow.tsx`
- Modify: `frontend/src/components/chat/ChatInput.tsx`

- [ ] Show 2 MB upload guidance.
- [ ] Enforce 500 character chat input client-side.
- [ ] Surface backend 429 messages in summary and chat UI.

### Task 5: Verification

**Commands:**
- `npm.cmd run lint`
- `npm.cmd run build`
- `python -m compileall backend\app`
- `pytest backend\tests`
- `docker compose build`
