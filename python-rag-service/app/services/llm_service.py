from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

RAG_SYSTEM_PROMPT = """You are an AI assistant answering questions using a provided knowledge base.

Rules:
1. Answer the user's question using ONLY the retrieved context provided below.
2. Do not invent facts or assume information not present in the context.
3. If the context does not contain enough information to answer, clearly state: "I could not find the answer to your question in the available documents."
4. Give the answer in a clear, natural, and helpful manner.
5. Combine multiple relevant context chunks when necessary to provide a complete answer.
6. Do not mention internal implementation details such as Pinecone, embeddings, vector search, or retrieval.
7. Do not mention that you are using "context" or "retrieved documents" — just answer naturally from the knowledge base."""

async def generate_answer(query: str, context: str) -> str:
    if not context:
        return 'I could not find the answer to your question in the available documents.'
    
    user_message = f'Retrieved Context:\n{context}\n\nUser Question:\n{query}'
    
    response = await client.chat.completions.create(
        model=settings.openai_llm_model,
        messages=[
            {'role': 'system', 'content': RAG_SYSTEM_PROMPT},
            {'role': 'user', 'content': user_message},
        ],
        temperature=0.1,
        max_tokens=1000,
    )
    
    return response.choices[0].message.content
