export interface SearchResponse {
  chatbot_id: string;
  query: string;
  answer: string;
  sources: { document_name: string; chunk_id: number; score: number; }[];
}

export interface IngestionResponse {
  message: string;
  chatbot_id: string;
  chunks_processed: number;
}

const BASE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000';
const API_KEY = process.env.PYTHON_RAG_SERVICE_API_KEY || 'test-key';

function getHeaders(extra: Record<string, string> = {}) {
  return { 'x-api-key': API_KEY, ...extra };
}

export async function ingestDocument(formData: FormData): Promise<IngestionResponse> {
  const res = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchChatbot(chatbotId: string, query: string, topK = 5): Promise<SearchResponse> {
  const res = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ chatbot_id: chatbotId, query, top_k: topK }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
