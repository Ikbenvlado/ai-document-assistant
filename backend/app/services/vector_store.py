import logging
import os

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from app.config import settings

logger = logging.getLogger(__name__)

_vector_store: Chroma | None = None


def get_vector_store(embeddings) -> Chroma:
    global _vector_store
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    if _vector_store is None:
        _vector_store = Chroma(
            embedding_function=embeddings,
            persist_directory=settings.chroma_persist_dir,
        )
        logger.info("Vector store initialized")
    return _vector_store


def index_document(document_id: str, text: str, embeddings) -> None:
    logger.info("Indexing document %s", document_id)
    store = get_vector_store(embeddings)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.default_chunk_size,
        chunk_overlap=settings.default_chunk_overlap,
    )
    chunks = splitter.create_documents(
        texts=[text],
        metadatas=[{"document_id": document_id}],
    )

    store.add_documents(chunks)
    logger.info("Document %s indexed (%d chunks)", document_id, len(chunks))


def delete_document_vectors(document_id: str, embeddings) -> None:
    logger.info("Deleting vectors for document %s", document_id)
    store = get_vector_store(embeddings)
    try:
        store.delete(filter={"document_id": document_id})
        logger.info("Vectors deleted for document %s", document_id)
    except Exception:
        logger.exception("Failed to delete vectors for document %s", document_id)
