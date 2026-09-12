import { NextResponse } from 'next/server';
import { buildCorsHeaders, buildPreflightCorsHeaders } from '@/lib/cors';
import { authenticatePublicRequest } from '@/lib/publicAuth';

export const dynamic = 'force-dynamic';

/**
 * Public, CORS-enabled endpoint the embeddable widget calls on init to pull
 * its appearance/behavior (position, color, welcome message, chatbot name)
 * from the dashboard-managed `widgetConfig`, instead of requiring the
 * embedding website to hardcode all of that in JS.
 */

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: buildPreflightCorsHeaders(origin) });
}

export async function GET(request: Request) {
  const { chatbot, origin, errorStatus, errorMessage } = await authenticatePublicRequest(request);

  if (!chatbot) {
    return NextResponse.json({ error: errorMessage || 'Unauthorized' }, { status: errorStatus || 401 });
  }

  const corsHeaders = buildCorsHeaders(origin, chatbot.allowedOrigins);

  return NextResponse.json(
    {
      name: chatbot.name,
      position: chatbot.widgetConfig?.position ?? 'bottom-right',
      primaryColor: chatbot.widgetConfig?.primaryColor ?? '#4f46e5',
      welcomeMessage: chatbot.widgetConfig?.welcomeMessage ?? 'Hi! How can I help you today?',
    },
    { status: 200, headers: corsHeaders }
  );
}
