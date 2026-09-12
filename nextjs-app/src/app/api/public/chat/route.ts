import { NextResponse } from 'next/server';
import { buildCorsHeaders, buildPreflightCorsHeaders } from '@/lib/cors';
import { authenticatePublicRequest } from '@/lib/publicAuth';
import { answerChatbotQuery } from '@/lib/chat';

export const dynamic = 'force-dynamic';

/**
 * Public, CORS-enabled endpoint for the embeddable chatbot widget running on
 * an external website. Authenticated via a per-chatbot `apiKey` (Authorization:
 * Bearer <key> or x-api-key header) instead of the dashboard's session cookie.
 * The API key alone identifies which chatbot to use — the widget/customer
 * site never needs to know the internal chatbot uuid.
 */

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: buildPreflightCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const { chatbot, origin, errorStatus, errorMessage } = await authenticatePublicRequest(request);

  if (!chatbot) {
    return NextResponse.json({ error: errorMessage || 'Unauthorized' }, { status: errorStatus || 401 });
  }

  const corsHeaders = buildCorsHeaders(origin, chatbot.allowedOrigins);

  try {
    const body = await request.json();
    const { query, top_k } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400, headers: corsHeaders });
    }

    // Cap top_k to keep public-facing usage bounded regardless of what a
    // caller passes in.
    const topK = typeof top_k === 'number' && top_k > 0 ? Math.min(Math.floor(top_k), 10) : 5;

    const { answer, sources } = await answerChatbotQuery(chatbot.uuid, query.trim(), topK);

    return NextResponse.json({ answer, sources }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Public chatbot chat failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
