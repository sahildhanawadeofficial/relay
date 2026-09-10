import os
import pytest

# ---------------------------------------------------------------------------
# Set required env vars BEFORE any app module is imported.
# This ensures pydantic-settings can construct Settings() during collection.
# ---------------------------------------------------------------------------
os.environ.setdefault("OPENAI_API_KEY", "sk-test-key")
os.environ.setdefault("PINECONE_API_KEY", "test-pinecone-key")
os.environ.setdefault("PINECONE_INDEX_NAME", "test-index")
os.environ.setdefault("PYTHON_SERVICE_API_KEY", "test_key")
os.environ.setdefault("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
os.environ.setdefault("OPENAI_LLM_MODEL", "gpt-4o-mini")

from fastapi.testclient import TestClient  # noqa: E402 (after env setup)
from app.main import app  # noqa: E402


class MockMatch:
    """Mimics a Pinecone ScoredVector match object."""

    def __init__(self, score: float, metadata: dict):
        self.score = score
        self.metadata = metadata


@pytest.fixture
def test_client():
    return TestClient(app, headers={"x-api-key": "test_key"})


@pytest.fixture
def mock_openai_embed(mocker):
    async def _embed(*args, **kwargs):
        return [[0.1] * 1536]

    return mocker.patch("app.services.embedding_service.embed_texts", side_effect=_embed)


@pytest.fixture
def mock_openai_embed_single(mocker):
    async def _embed(*args, **kwargs):
        return [0.1] * 1536

    return mocker.patch("app.services.embedding_service.embed_text", side_effect=_embed)


@pytest.fixture
def mock_pinecone_upsert(mocker):
    return mocker.patch("app.services.pinecone_service.upsert_vectors")


@pytest.fixture
def mock_pinecone_query(mocker):
    def _query(vector, chatbot_id, top_k):
        return [
            MockMatch(
                score=0.9,
                metadata={
                    "chatbot_id": chatbot_id,
                    "document_name": "test.txt",
                    "chunk_id": 0,
                    "text": "test content",
                },
            )
        ]

    return mocker.patch("app.services.pinecone_service.query_vectors", side_effect=_query)


@pytest.fixture
def mock_pinecone_query_empty(mocker):
    return mocker.patch("app.services.pinecone_service.query_vectors", return_value=[])


@pytest.fixture
def mock_llm(mocker):
    async def _generate(*args, **kwargs):
        return "This is a mock answer."

    return mocker.patch("app.services.llm_service.generate_answer", side_effect=_generate)
