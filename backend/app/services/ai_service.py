import logging

from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.config import settings
from app.models.document import Document
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_api_base,
        model=settings.deepseek_model,
        temperature=0.3,
        timeout=60,
        max_retries=2,
        max_tokens=settings.demo_llm_max_tokens if settings.demo_mode else 1024,
    )


def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        api_key=settings.openai_api_key,
        model=settings.embedding_model,
    )


async def summarize_document(doc: Document) -> str:
    logger.info("Summarizing document %s", doc.id)

    if doc.file_type == "pdf":
        loader = PyPDFLoader(doc.file_path)
        pages = loader.load()
        if settings.demo_mode:
            content = "\n\n".join(page.page_content for page in pages)
            pages = [LCDocument(page_content=content[: settings.demo_max_document_chars])]
    else:
        with open(doc.file_path, "r", encoding="utf-8") as f:
            content = f.read()
        if settings.demo_mode:
            content = content[: settings.demo_max_document_chars]
        pages = [LCDocument(page_content=content)]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.default_chunk_size,
        chunk_overlap=settings.default_chunk_overlap,
    )
    docs = splitter.split_documents(pages)

    chain = load_summarize_chain(get_llm(), chain_type="map_reduce")
    result = await chain.ainvoke(docs)

    logger.info("Summary generated for document %s", doc.id)
    return result["output_text"]


async def ask_document_question(document_id: str, question: str) -> tuple[str, list[str]]:
    logger.info("Chat query for document %s", document_id)

    vector_store = get_vector_store(get_embeddings())
    retriever = vector_store.as_retriever(
        search_kwargs={
            "filter": {"document_id": document_id},
            "k": settings.demo_retriever_k if settings.demo_mode else 4,
        }
    )

    system_prompt = (
        "You are a helpful document assistant. Answer the question based on the "
        "provided context. If the answer cannot be found in the context, say so. "
        "Keep answers concise and cite the source when possible.\n\n"
        "Context:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    combine_docs_chain = create_stuff_documents_chain(get_llm(), prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)

    result = await retrieval_chain.ainvoke({"input": question})

    sources = []
    for doc_item in result.get("context", []):
        source_text = doc_item.page_content[:200].strip()
        sources.append(source_text)

    logger.info("Chat response for document %s: %d sources", document_id, len(sources))
    return result["answer"], sources
