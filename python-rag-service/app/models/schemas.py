from pydantic import BaseModel, Field
from typing import Optional

class SearchRequest(BaseModel):
    chatbot_id: str
    query: str
    top_k: Optional[int] = 5

class Source(BaseModel):
    document_name: str
    chunk_id: int
    score: float

class SearchResponse(BaseModel):
    chatbot_id: str
    query: str
    answer: str
    sources: list[Source]

class IngestionResponse(BaseModel):
    message: str
    chatbot_id: str
    document_name: str
    chunks_processed: int

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
