import pytest
import uuid
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient
from app.main import app


def _make_embed_text_mock(mocker):
    """Return an AsyncMock that simulates embed_text returning a 1536-dim vector."""
    return mocker.patch(
        "app.services.embedding_service.embed_text",
        new_callable=AsyncMock,
        return_value=[0.1] * 1536,
    )


def test_search_with_results(test_client, mock_pinecone_query, mock_llm, mocker):
    _make_embed_text_mock(mocker)
    data = {"chatbot_id": str(uuid.uuid4()), "query": "test query"}
    response = test_client.post("/search/", json=data)
    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "This is a mock answer."
    assert len(body["sources"]) == 1
    assert body["sources"][0]["document_name"] == "test.txt"


def test_search_no_results(test_client, mock_llm, mocker):
    _make_embed_text_mock(mocker)
    mocker.patch("app.services.pinecone_service.query_vectors", return_value=[])
    data = {"chatbot_id": str(uuid.uuid4()), "query": "test query"}
    response = test_client.post("/search/", json=data)
    assert response.status_code == 200
    body = response.json()
    assert "I could not find the answer" in body["answer"]
    assert len(body["sources"]) == 0


def test_search_chatbot_isolation(test_client, mock_llm, mocker):
    _make_embed_text_mock(mocker)
    cb_id = str(uuid.uuid4())
    mock_q = mocker.patch("app.services.pinecone_service.query_vectors", return_value=[])
    data = {"chatbot_id": cb_id, "query": "test query"}
    test_client.post("/search/", json=data)
    mock_q.assert_called_once()
    # The second positional arg to query_vectors is chatbot_id
    assert mock_q.call_args[0][1] == cb_id


def test_search_empty_query(test_client):
    data = {"chatbot_id": str(uuid.uuid4()), "query": "   "}
    response = test_client.post("/search/", json=data)
    assert response.status_code == 400


def test_search_invalid_chatbot_id(test_client):
    data = {"chatbot_id": "invalid-uuid", "query": "test query"}
    response = test_client.post("/search/", json=data)
    assert response.status_code == 400


def test_search_no_api_key():
    client = TestClient(app)  # no x-api-key header
    data = {"chatbot_id": str(uuid.uuid4()), "query": "test query"}
    response = client.post("/search/", json=data)
    assert response.status_code == 401


def test_similarity_threshold(test_client, mock_llm, mocker):
    _make_embed_text_mock(mocker)
    from tests.conftest import MockMatch

    def mock_query(vector, chatbot_id, top_k):
        return [
            MockMatch(score=0.9, metadata={"chatbot_id": chatbot_id, "document_name": "pass.txt", "chunk_id": 0, "text": "pass"}),
            MockMatch(score=0.5, metadata={"chatbot_id": chatbot_id, "document_name": "fail.txt", "chunk_id": 1, "text": "fail"}),
        ]

    mocker.patch("app.services.pinecone_service.query_vectors", side_effect=mock_query)
    data = {"chatbot_id": str(uuid.uuid4()), "query": "test query"}
    response = test_client.post("/search/", json=data)
    assert response.status_code == 200
    body = response.json()
    # Only the score=0.9 match should pass the 0.7 threshold
    assert len(body["sources"]) == 1
    assert body["sources"][0]["document_name"] == "pass.txt"


@pytest.mark.asyncio
async def test_search_llm_uses_context(mocker):
    from app.services.llm_service import generate_answer

    # AsyncMock so we can await it and inspect call args
    mock_create = AsyncMock()
    mock_choice = mocker.MagicMock()
    mock_choice.message.content = "answer"
    mock_create.return_value.choices = [mock_choice]

    mocker.patch("app.services.llm_service.client.chat.completions.create", mock_create)

    await generate_answer("my query", "my context string")

    mock_create.assert_awaited_once()
    call_kwargs = mock_create.call_args[1]
    messages = call_kwargs["messages"]
    user_msg = messages[1]["content"]
    assert "my query" in user_msg
    assert "my context string" in user_msg
