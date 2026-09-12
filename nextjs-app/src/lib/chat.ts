import { embedQuery, queryVectors } from '@/lib/pinecone';
import { generateAnswer, SourceItem } from '@/lib/llm';

export interface ChatAnswerResult {
  answer: string;
  sources: SourceItem[];
}

/**
 * Core RAG pipeline: embed the query, search Pinecone for this chatbot's
 * chunks, then have the LLM frame a natural-language answer from them.
 *
 * This is the single shared implementation used by BOTH:
 * - the session-authenticated dashboard route (`/api/chatbots/[chatbotId]/search`)
 * - the API-key-authenticated public widget route (`/api/public/[chatbotId]/chat`)
 *
 * Each caller is responsible for its own authentication/authorization
 * (session + ownership check, or API key + origin check) before calling this.
 */
export async function answerChatbotQuery(
  chatbotId: string,
  query: string,
  topK = 5
): Promise<ChatAnswerResult> {
  // 1. Generate query embedding using Pinecone native inference
  const queryEmbedding = await embedQuery(query);

  // 2. Query Pinecone vectors filtered by chatbot_id
  const matches = await queryVectors(queryEmbedding, chatbotId, topK);

  // 3. Format sources and context
  const sources: SourceItem[] = matches.map((m) => ({
    document_name: m.metadata.document_name || 'Unknown',
    chunk_id: m.metadata.chunk_id ?? 0,
    score: m.score,
  }));

  const contextParts = matches.map((m, i) => {
    const docName = m.metadata.document_name || 'Unknown';
    const text = m.metadata.text || '';
    return `DOCUMENT ${i + 1} (${docName}):\n${text}`;
  });

  const context = contextParts.join('\n\n');

  // 4. Generate answer
  const answer = await generateAnswer(query, context, sources);

  return { answer, sources };
}
