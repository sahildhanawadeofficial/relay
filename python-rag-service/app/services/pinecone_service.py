from pinecone import Pinecone
from app.config import settings

_pc: Pinecone | None = None
_index = None


def _get_index():
    """Lazy-initialize the Pinecone client and index on first use."""
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
        _index = _pc.Index(settings.pinecone_index_name)
    return _index


def upsert_vectors(vectors: list[dict]) -> None:
    if not vectors:
        return
    _get_index().upsert(vectors=vectors, namespace=settings.pinecone_namespace)


def query_vectors(
    vector: list[float],
    chatbot_id: str,
    top_k: int,
) -> list:
    result = _get_index().query(
        vector=vector,
        top_k=top_k,
        namespace=settings.pinecone_namespace,
        filter={"chatbot_id": {"$eq": chatbot_id}},
        include_metadata=True,
    )
    return result.matches
