import type { RemoteWidgetConfig, ChatSource } from './types';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

/**
 * Fetches the dashboard-configured appearance/behavior for this API key's
 * chatbot (position, color, welcome message, name). Returns null on any
 * failure so the widget can silently fall back to local/default config
 * instead of failing to render entirely.
 */
export async function fetchWidgetConfig(baseUrl: string, apiKey: string): Promise<RemoteWidgetConfig | null> {
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/api/public/config`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteWidgetConfig;
  } catch {
    return null;
  }
}

export async function sendChatMessage(
  baseUrl: string,
  apiKey: string,
  query: string,
  topK = 5
): Promise<{ answer: string; sources: ChatSource[] }> {
  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/api/public/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, top_k: topK }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return { answer: data.answer, sources: data.sources ?? [] };
}
