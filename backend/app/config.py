from ipaddress import ip_address, ip_network

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    deepseek_api_key: str = ""
    deepseek_api_base: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"

    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"

    database_url: str = "sqlite:///./data/documents.db"
    chroma_persist_dir: str = "./data/chroma"
    upload_dir: str = "./data/uploads"
    frontend_url: str = "http://localhost:3000"
    frontend_urls: str = ""

    default_chunk_size: int = 1000
    default_chunk_overlap: int = 200

    demo_mode: bool = True
    daily_upload_limit: int = 20
    daily_summary_limit: int = 30
    daily_chat_limit: int = 80
    per_ip_upload_limit: int = 2
    per_ip_summary_limit: int = 3
    per_ip_chat_limit: int = 10
    demo_max_file_size_mb: int = 2
    demo_max_question_length: int = 500
    demo_max_document_chars: int = 20_000
    demo_retriever_k: int = 3
    demo_llm_max_tokens: int = 600
    demo_limit_exempt_ips: str = ""

    def cors_origins(self) -> list[str]:
        origins = {"http://localhost:3000"}
        configured_urls = [self.frontend_url, *self.frontend_urls.split(",")]
        for url in configured_urls:
            origin = url.strip().rstrip("/")
            if origin:
                origins.add(origin)
        return sorted(origins)

    def is_demo_limit_exempt(self, visitor_key: str) -> bool:
        for raw_entry in self.demo_limit_exempt_ips.split(","):
            entry = raw_entry.strip()
            if not entry:
                continue
            if entry == visitor_key:
                return True
            try:
                if ip_address(visitor_key) in ip_network(entry, strict=False):
                    return True
            except ValueError:
                continue
        return False

    def missing_ai_keys(self) -> list[str]:
        missing = []
        if not self.deepseek_api_key:
            missing.append("DEEPSEEK_API_KEY")
        if not self.openai_api_key:
            missing.append("OPENAI_API_KEY")
        return missing

    def validate_ai_keys(self) -> None:
        missing = self.missing_ai_keys()
        if missing:
            joined = ", ".join(missing)
            raise RuntimeError(f"Missing required AI configuration: {joined}")


settings = Settings()
