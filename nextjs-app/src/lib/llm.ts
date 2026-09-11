export interface SourceItem {
  document_name: string;
  chunk_id: number;
  score: number;
}

export interface GeneratedAnswer {
  answer: string;
  sources: SourceItem[];
}

const RAG_SYSTEM_PROMPT = `You are an AI assistant answering questions using a provided knowledge base.

Rules:
1. Answer the user's question using ONLY the retrieved context provided below.
2. Do not invent facts or assume information not present in the context.
3. If the context does not contain enough information to answer, clearly state: "I could not find the answer to your question in the available documents."
4. Give the answer in a clear, natural, and helpful manner.
5. Combine multiple relevant context chunks when necessary to provide a complete answer.
6. Do not mention internal implementation details such as Pinecone, embeddings, vector search, or retrieval.
7. Do not mention that you are using "context" or "retrieved documents" — just answer naturally from the knowledge base.`;

export async function generateAnswer(
  query: string,
  context: string,
  sources: SourceItem[]
): Promise<string> {
  if (!context || sources.length === 0) {
    return 'I could not find the answer to your question in the available documents.';
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini';

  // If OpenAI key is provided, attempt OpenAI chat completion
  if (apiKey && apiKey.startsWith('sk-')) {
    try {
      const userMessage = `Retrieved Context:\n${context}\n\nUser Question:\n${query}`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: RAG_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const errText = await res.text();
        console.warn('OpenAI chat completion unavailable:', errText);
      }
    } catch (err) {
      console.warn('Error calling OpenAI chat completion:', err);
    }
  }

  // Graceful fallback when OpenAI API key has no credit or is not configured:
  // Return a clear, informative answer formatted from the top retrieved knowledge context
  const primaryDoc = sources[0]?.document_name || 'your document';
  const cleanContext = context
    .replace(/DOCUMENT \d+ \([^)]+\):\n/g, '')
    .trim()
    .slice(0, 1500);

  return `Here is the relevant information found in **${primaryDoc}**:\n\n> ${cleanContext}\n\n*(Note: Configure an active OpenAI API key or credits in .env for generative conversational rephrasing.)*`;
}
