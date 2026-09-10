from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    # Required — no defaults: app will fail to start if these are missing
    openai_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str
    python_service_api_key: str

    # Optional with sensible defaults
    openai_embedding_model: str = "text-embedding-3-small"
    openai_llm_model: str = "gpt-4o-mini"
    pinecone_namespace: str = "default"

    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    similarity_threshold: float = 0.7

    @field_validator("openai_api_key", "pinecone_api_key", "pinecone_index_name", "python_service_api_key")
    @classmethod
    def must_not_be_empty(cls, v: str, info) -> str:
        if not v.strip():
            raise ValueError(f"{info.field_name} must not be empty")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
