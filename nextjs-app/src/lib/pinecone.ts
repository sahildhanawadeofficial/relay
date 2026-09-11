import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'chatbot-platform';
const INDEX_HOST = process.env.PINECONE_INDEX_HOST;
const NAMESPACE = process.env.PINECONE_NAMESPACE || 'default';
const EMBEDDING_MODEL = process.env.PINECONE_EMBEDDING_MODEL || 'multilingual-e5-large';

function getIndex() {
  const pc = getPineconeClient();
  return INDEX_HOST ? pc.index(INDEX_NAME, INDEX_HOST) : pc.index(INDEX_NAME);
}

/**
 * Generate embeddings using Pinecone's native hosted inference.
 * No external OpenAI embedding credits needed!
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const pc = getPineconeClient();

  // Pinecone Inference embed API takes a single options object in TypeScript SDK
  const response: any = await pc.inference.embed({
    model: EMBEDDING_MODEL,
    inputs: texts,
    parameters: { inputType: 'passage', truncate: 'END' },
  });

  const items = response.data || response;
  return items.map((item: any) => item.values as number[]);
}

export async function embedQuery(query: string): Promise<number[]> {
  const pc = getPineconeClient();

  const response: any = await pc.inference.embed({
    model: EMBEDDING_MODEL,
    inputs: [query],
    parameters: { inputType: 'query', truncate: 'END' },
  });

  const items = response.data || response;
  return items[0].values as number[];
}

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: {
    chatbot_id: string;
    document_id: string;
    document_name: string;
    chunk_id: number;
    text: string;
  };
}

export async function upsertVectors(vectors: PineconeRecord[]): Promise<void> {
  if (vectors.length === 0) return;
  const index = getIndex();

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(NAMESPACE).upsert({ records: batch });
  }
}

export interface QueryMatch {
  id: string;
  score: number;
  metadata: {
    chatbot_id: string;
    document_id: string;
    document_name: string;
    chunk_id: number;
    text: string;
  };
}

export async function queryVectors(
  vector: number[],
  chatbotId: string,
  topK = 5
): Promise<QueryMatch[]> {
  const index = getIndex();

  const result = await index.namespace(NAMESPACE).query({
    vector,
    topK,
    filter: { chatbot_id: { $eq: chatbotId } },
    includeMetadata: true,
  });

  return (result.matches || []).map((m: any) => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: (m.metadata || {}) as QueryMatch['metadata'],
  }));
}
