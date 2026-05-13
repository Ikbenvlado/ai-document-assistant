# AI Document Assistant

Upload PDF or TXT documents, get AI-powered summaries, and chat with your document content.

![Stack](https://img.shields.io/badge/next.js-16-black?logo=next.js) ![Stack](https://img.shields.io/badge/fastapi-0.115-teal?logo=fastapi) ![Stack](https://img.shields.io/badge/langchain-0.3-green?logo=langchain) ![Stack](https://img.shields.io/badge/python-3.12-blue?logo=python) ![Stack](https://img.shields.io/badge/typescript-5-blue?logo=typescript) ![Stack](https://img.shields.io/badge/tailwind-4-06b6d4?logo=tailwindcss)

---

## Features

- **Upload** PDF or TXT files via drag & drop (max 10 MB)
- **Document list** with status badges and instant delete
- **AI Summary** — one-click summarization using DeepSeek LLM
- **Chat with documents** — ask questions, get answers with source references
- **Loading, empty, and error states** on every page
- **Toast notifications** for all actions
- **Upload progress bar** with cancel support
- **Confirm dialogs** before destructive actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.12 |
| AI / LLM | LangChain + DeepSeek (`deepseek-chat`) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector Store | ChromaDB (persistent) |
| Database | SQLite |

## Architecture

```
Browser (Next.js :3000)
    │
    ├── Upload PDF/TXT ──►  FastAPI (:8000)
    │                            │
    ├── List documents ◄───  SQLite (metadata)
    │                            │
    ├── Generate summary ──►  DeepSeek LLM
    │                            │
    └── Chat question ──►  OpenAI Embeddings → ChromaDB → DeepSeek LLM
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- API keys: [DeepSeek](https://platform.deepseek.com) + [OpenAI](https://platform.openai.com)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

### 3. Docker (optional)

```bash
docker compose up
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|------------|
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DEEPSEEK_API_BASE` | DeepSeek API base URL |
| `DEEPSEEK_MODEL` | Model name (default: `deepseek-chat`) |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) |
| `EMBEDDING_MODEL` | Embedding model (default: `text-embedding-3-small`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/documents/upload` | Upload a document |
| `GET` | `/api/v1/documents` | List all documents |
| `GET` | `/api/v1/documents/{id}` | Document detail |
| `DELETE` | `/api/v1/documents/{id}` | Delete document + vectors |
| `POST` | `/api/v1/documents/{id}/summarize` | Generate AI summary |
| `GET` | `/api/v1/documents/{id}/summary` | Get existing summary |
| `POST` | `/api/v1/documents/{id}/chat` | Ask a question |
| `GET` | `/api/v1/health` | Health check |

## Project Structure

```
├── frontend/src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard — document list
│   │   ├── upload/page.tsx     # Upload page
│   │   └── documents/[id]/     # Document detail + chat
│   ├── components/
│   │   ├── layout/             # Navbar
│   │   ├── documents/          # DocumentCard
│   │   ├── chat/               # ChatWindow, ChatMessage, ChatInput
│   │   └── ui/                 # Toast, ConfirmDialog, LoadingSpinner, ...
│   └── lib/                    # API client, types
├── backend/app/
│   ├── main.py                 # FastAPI app + CORS + error handler
│   ├── config.py               # Settings (pydantic-settings)
│   ├── db.py                   # SQLAlchemy + SQLite
│   ├── routes/                 # documents.py, chat.py
│   ├── services/               # Business logic + AI pipeline
│   ├── models/                 # ORM models + Pydantic schemas
│   └── utils/                  # File validation, helpers
├── docker-compose.yml
└── README.md
```
