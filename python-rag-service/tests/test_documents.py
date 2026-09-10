import pytest
import uuid

from fastapi.testclient import TestClient
from app.main import app


def test_upload_pdf_success(test_client, mock_openai_embed, mock_pinecone_upsert, mocker):
    mocker.patch(
        "app.utils.document_parser.extract_text",
        return_value="pdf content " * 20,
    )
    files = {"file": ("test.pdf", b"dummy pdf bytes", "application/pdf")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 200
    body = response.json()
    assert body["chunks_processed"] > 0
    assert body["document_name"] == "test.pdf"


def test_upload_docx_success(test_client, mock_openai_embed, mock_pinecone_upsert, mocker):
    mocker.patch(
        "app.utils.document_parser.extract_text",
        return_value="docx content " * 20,
    )
    files = {
        "file": (
            "test.docx",
            b"dummy docx bytes",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    }
    data = {"chatbot_id": str(uuid.uuid4())}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 200
    assert response.json()["chunks_processed"] > 0


def test_upload_txt_success(test_client, mock_openai_embed, mock_pinecone_upsert, mocker):
    mocker.patch(
        "app.utils.document_parser.extract_text",
        return_value="txt content " * 20,
    )
    files = {"file": ("test.txt", b"dummy txt bytes", "text/plain")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 200
    assert response.json()["chunks_processed"] > 0


def test_upload_unsupported_format(test_client):
    files = {"file": ("test.exe", b"dummy", "application/x-msdownload")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_invalid_chatbot_id(test_client):
    files = {"file": ("test.txt", b"dummy", "text/plain")}
    data = {"chatbot_id": "not-a-valid-uuid"}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 400


def test_upload_empty_document(test_client, mocker):
    mocker.patch("app.utils.document_parser.extract_text", return_value="")
    files = {"file": ("test.txt", b"   ", "text/plain")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = test_client.post("/documents/", files=files, data=data)
    assert response.status_code == 422
    assert "contains no extractable text" in response.json()["detail"]


def test_upload_no_api_key():
    """Client with no x-api-key header should get 401."""
    client = TestClient(app)  # no API key header
    files = {"file": ("test.txt", b"dummy", "text/plain")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = client.post("/documents/", files=files, data=data)
    assert response.status_code == 401


def test_upload_wrong_api_key():
    """Client with wrong x-api-key header should get 401."""
    client = TestClient(app, headers={"x-api-key": "totally-wrong-key"})
    files = {"file": ("test.txt", b"dummy", "text/plain")}
    data = {"chatbot_id": str(uuid.uuid4())}
    response = client.post("/documents/", files=files, data=data)
    assert response.status_code == 401


def test_chunking():
    from app.utils.chunker import chunk_text
    from app.config import settings

    original_size = settings.chunk_size
    original_overlap = settings.chunk_overlap
    try:
        settings.chunk_size = 50
        settings.chunk_overlap = 10
        text = "A" * 200
        chunks = chunk_text(text, {"meta": "data"})
        assert len(chunks) > 1
        assert chunks[0]["meta"] == "data"
        assert "chunk_id" in chunks[0]
        assert "text" in chunks[0]
    finally:
        settings.chunk_size = original_size
        settings.chunk_overlap = original_overlap


def test_document_parser_pdf(mocker):
    from app.utils.document_parser import _parse_pdf

    mock_pdf = mocker.MagicMock()
    mock_page = mocker.MagicMock()
    mock_page.extract_text.return_value = "parsed pdf text"
    mock_pdf.__enter__.return_value.pages = [mock_page]
    mocker.patch("pdfplumber.open", return_value=mock_pdf)
    text = _parse_pdf("dummy.pdf")
    assert text == "parsed pdf text"
