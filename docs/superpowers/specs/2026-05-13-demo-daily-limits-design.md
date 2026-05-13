# Demo Daily Limits Design

## Goal

Protect public portfolio demo API credits with strict daily usage limits, smaller inputs, shorter model outputs, and clear user-facing demo limit messages.

## Scope

The app will enforce limits before expensive operations: upload/indexing, summarization, and chat. Limits apply both globally per day and per visitor per day. For the portfolio demo, the visitor key is the client IP; if authentication is added later, the same limiter can use `user_id` instead. The ledger is stored in SQLite so it survives backend restarts.

## Defaults

- Global daily uploads: 20
- Global daily summaries: 30
- Global daily chat questions: 80
- Per-IP daily uploads: 2
- Per-IP daily summaries: 3
- Per-IP daily chat questions: 10
- Upload size: 2 MB
- Chat question length: 500 characters
- Extracted document text indexed/summarized: 20,000 characters
- Chat retrieval chunks: 3
- LLM output tokens: 600

## Behavior

When a limit is exceeded, backend returns HTTP 429 with a concise demo message. Frontend surfaces the backend `detail` text in upload, summary, and chat flows. The upload screen also states the public demo visitor limit before a file is selected. Existing SlowAPI burst limits remain as a second layer.

## Architecture

Add a `UsageLedger` model and a small `usage_limiter` service. Routes call `check_and_increment_usage` before doing costly work. Demo settings live in `Settings` so they can be changed through environment variables.
