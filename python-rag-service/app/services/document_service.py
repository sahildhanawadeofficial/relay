import uuid
import tempfile
import os
from fastapi import UploadFile
from app.utils import document_parser as _parser
from app.utils import chunker as _chunker
from app.services import embedding_service as _embeddings
from app.services import pinecone_service as _pinecone


async def ingest_document(file: UploadFile, chatbot_id: str) -> dict:
    document_id = str(uuid.uuid4())
    document_name = file.filename or "unknown"

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(document_name)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = _parser.extract_text(tmp_path, document_name)
        if not text.strip():
            raise ValueError("Document contains no extractable text")

        chunk_metadata = {
            "chatbot_id": chatbot_id,
            "document_id": document_id,
            "document_name": document_name,
        }
        chunks = _chunker.chunk_text(text, chunk_metadata)

        texts = [c["text"] for c in chunks]
        embeddings = await _embeddings.embed_texts(texts)

        vectors = []
        for chunk, embedding in zip(chunks, embeddings):
            vector_id = f"{chatbot_id}_{document_id}_{chunk['chunk_id']}"
            vectors.append(
                {
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "chatbot_id": chatbot_id,
                        "document_id": document_id,
                        "document_name": document_name,
                        "chunk_id": chunk["chunk_id"],
                        "text": chunk["text"],
                    },
                }
            )

        _pinecone.upsert_vectors(vectors)

        return {
            "document_id": document_id,
            "document_name": document_name,
            "chunks_processed": len(chunks),
        }
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
