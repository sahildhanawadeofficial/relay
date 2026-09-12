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
7. Do not mention that you are using "context" or "retrieved documents" — just answer naturally from the knowledge base.
8. Respond with ONLY the final answer. Never include your reasoning, chain-of-thought, step-by-step thinking, planning notes, or any meta-commentary (e.g. "Here's a thinking process", "Let me analyze this") about how you produced the answer.`;

// Primary + fallback models tried in order via OpenRouter's `models` array.
// The default primary is a plain instruction-tuned model (no visible
// chain-of-thought), which is the right fit for straightforward RAG answer
// synthesis. Reasoning ("thinking") models like openai/gpt-oss-120b:free are
// kept as fallbacks — they work fine, but on free/quantized endpoints they
// sometimes leak their raw thinking trace into the response instead of a
// clean final answer, so they're not the safest default primary. `openrouter/free`
// is OpenRouter's own "Free Models Router" and auto-picks whatever free model
// is currently healthy, acting as a last-resort catch-all before we drop to
// the raw-chunk fallback below.
const DEFAULT_FALLBACK_MODELS = [
  'openai/gpt-oss-120b:free',
  'deepseek/deepseek-r1:free',
  'openrouter/free',
];

// Reasoning models sometimes leak their internal "thinking" trace into the
// response content (especially on free/quantized endpoints), instead of a
// clean final answer. Treat that as a failed generation so we fall back to
// the raw-chunk answer rather than showing broken chain-of-thought text.
function looksLikeLeakedReasoning(text: string): boolean {
  const head = text.slice(0, 300).toLowerCase();
  return /here'?s (a |my )?thinking process|^\s*(let me think|let's think|okay,? let me|chain of thought)/i.test(
    head
  );
}

export async function generateAnswer(
  query: string,
  context: string,
  sources: SourceItem[]
): Promise<string> {
  if (!context || sources.length === 0) {
    return 'I could not find the answer to your question in the available documents.';
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_LLM_MODEL?.trim() || 'meta-llama/llama-3.3-70b-instruct:free';
  const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || DEFAULT_FALLBACK_MODELS.join(','))
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m !== model);

  // If an OpenRouter key is provided, attempt an OpenRouter chat completion
  // (OpenAI-compatible API, so the request/response shape is unchanged).
  if (apiKey) {
    try {
      const userMessage = `Retrieved Context:\n${context}\n\nUser Question:\n${query}`;

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          // Recommended (not required) by OpenRouter for attribution/analytics.
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'Relay',
        },
        body: JSON.stringify({
          model,
          // Automatic model-level fallback: if `model` is down/rate-limited,
          // OpenRouter tries these in order before the request fails.
          models: fallbackModels,
          messages: [
            { role: 'system', content: RAG_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          // Ask reasoning-capable models (e.g. gpt-oss-120b, deepseek-r1) to
          // keep thinking internally but strip it from the response, so the
          // `content` field always contains just the final answer.
          reasoning: { effort: 'low', exclude: true },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && !looksLikeLeakedReasoning(content)) return content;
        if (content) {
          console.warn('OpenRouter response looked like a leaked reasoning trace; falling back to raw context.');
        } else {
          console.warn('OpenRouter response had no message content; falling back to raw context.');
        }
      } else {
        const errText = await res.text();
        console.warn(`OpenRouter chat completion failed (status ${res.status}) using model "${model}":`, errText);
      }
    } catch (err) {
      console.warn('Error calling OpenRouter chat completion:', err);
    }
  } else {
    console.warn('OPENROUTER_API_KEY is not set. Falling back to raw context instead of a generative answer.');
  }

  // Graceful fallback when OpenRouter is rate-limited/unavailable or not configured:
  // Return a clear, informative answer formatted from the top retrieved knowledge context
  const primaryDoc = sources[0]?.document_name || 'your document';
  const cleanContext = context
    .replace(/DOCUMENT \d+ \([^)]+\):\n/g, '')
    .trim()
    .slice(0, 1500);

  return `Here is the relevant information found in **${primaryDoc}**:\n\n> ${cleanContext}\n\n*(Note: Configure an active OPENROUTER_API_KEY in .env for generative conversational rephrasing.)*`;
}
