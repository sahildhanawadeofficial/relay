from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

def chunk_text(text: str, metadata: dict) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
    )
    chunks = splitter.split_text(text)
    return [
        {
            'text': chunk,
            'chunk_id': i,
            **metadata,
        }
        for i, chunk in enumerate(chunks)
    ]
