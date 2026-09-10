from app.services.embedding_service import embed_text
from app.services.pinecone_service import query_vectors
from app.config import settings

async def retrieve_context(chatbot_id: str, query: str, top_k: int) -> tuple[str, list[dict]]:
    query_embedding = await embed_text(query)
    
    matches = query_vectors(query_embedding, chatbot_id, top_k)
    
    filtered = [m for m in matches if m.score >= settings.similarity_threshold]
    
    if not filtered:
        return '', []
    
    context_parts = []
    for i, match in enumerate(filtered):
        doc_name = match.metadata.get('document_name', 'Unknown')
        text = match.metadata.get('text', '')
        context_parts.append(f'DOCUMENT {i+1} ({doc_name}):\n{text}')
    
    context = '\n\n'.join(context_parts)
    
    sources = [
        {
            'document_name': m.metadata.get('document_name', 'Unknown'),
            'chunk_id': int(m.metadata.get('chunk_id', 0)),
            'score': m.score,
        }
        for m in filtered
    ]
    
    return context, sources
