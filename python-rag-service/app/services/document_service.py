import uuid
import tempfile
import os
from fastapi import UploadFile
from app.utils.document_parser import extract_text
from app.utils.chunker import chunk_text
from app.services.embedding_service import embed_texts
from app.services.pinecone_service import upsert_vectors

async def ingest_document(file: UploadFile, chatbot_id: str) -> dict:
    document_id = str(uuid.uuid4())
    document_name = file.filename or "unknown"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(document_name)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        text = extract_text(tmp_path, document_name)
        if not text.strip():
            raise ValueError('Document contains no extractable text')
        
        chunk_metadata = {
            'chatbot_id': chatbot_id,
            'document_id': document_id,
            'document_name': document_name,
        }
        chunks = chunk_text(text, chunk_metadata)
        
        texts = [c['text'] for c in chunks]
        embeddings = await embed_texts(texts)
        
        vectors = []
        for chunk, embedding in zip(chunks, embeddings):
            vector_id = f"{chatbot_id}_{document_id}_{chunk['chunk_id']}"
            vectors.append({
                'id': vector_id,
                'values': embedding,
                'metadata': {
                    'chatbot_id': chatbot_id,
                    'document_id': document_id,
                    'document_name': document_name,
                    'chunk_id': chunk['chunk_id'],
                    'text': chunk['text'],
                },
            })
        
        upsert_vectors(vectors)
        
        return {
            'document_id': document_id,
            'document_name': document_name,
            'chunks_processed': len(chunks),
        }
    finally:
        os.unlink(tmp_path)
