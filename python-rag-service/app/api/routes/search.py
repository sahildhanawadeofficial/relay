from fastapi import APIRouter, HTTPException
from app.models.schemas import SearchRequest, SearchResponse, Source
from app.services.retrieval_service import retrieve_context
from app.services.llm_service import generate_answer
import uuid

router = APIRouter()

@router.post('/', response_model=SearchResponse)
async def search(
    request: SearchRequest,
):
    try:
        uuid.UUID(request.chatbot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid chatbot_id format')
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail='Query cannot be empty')
    
    top_k = request.top_k or 5
    
    try:
        context, sources = await retrieve_context(request.chatbot_id, request.query, top_k)
        answer = await generate_answer(request.query, context)
        
        return SearchResponse(
            chatbot_id=request.chatbot_id,
            query=request.query,
            answer=answer,
            sources=[Source(**s) for s in sources],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Search failed: {str(e)}')
