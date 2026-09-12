import { dbConnect } from '@/lib/db';
import { Chatbot, IChatbot } from '@/models/Chatbot';
import { isOriginAllowed } from '@/lib/cors';

export interface PublicAuthResult {
  chatbot: IChatbot | null;
  origin: string | null;
  errorStatus?: number;
  errorMessage?: string;
}

function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey) return xApiKey.trim();
  return null;
}

/**
 * Authenticates a request to the public widget API (used by the embeddable
 * widget on external websites) via a per-chatbot `apiKey`, and enforces the
 * chatbot's `allowedOrigins` allow-list. There is no user session here —
 * the API key itself is the credential AND identifies which chatbot to use,
 * so the widget/customer site never needs to know the internal chatbot uuid.
 */
export async function authenticatePublicRequest(request: Request): Promise<PublicAuthResult> {
  const origin = request.headers.get('origin');
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return { chatbot: null, origin, errorStatus: 401, errorMessage: 'Missing API key' };
  }

  await dbConnect();
  const chatbot = await Chatbot.findOne({ apiKey });

  if (!chatbot) {
    return { chatbot: null, origin, errorStatus: 401, errorMessage: 'Invalid API key' };
  }

  if (!isOriginAllowed(origin, chatbot.allowedOrigins)) {
    return { chatbot: null, origin, errorStatus: 403, errorMessage: 'Origin not allowed for this API key' };
  }

  return { chatbot, origin };
}
