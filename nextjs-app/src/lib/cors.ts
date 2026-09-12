/**
 * CORS helpers for the public widget API (`/api/public/*`), which must be
 * callable via browser `fetch()` from arbitrary external websites
 * embedding the chatbot widget. The API key in the request (not a URL
 * param) identifies which chatbot's `allowedOrigins` to enforce.
 */

const DEFAULT_ALLOWED_ORIGINS = ['*'];

/**
 * Checks whether `origin` is permitted by a chatbot's `allowedOrigins` list.
 * - No `Origin` header (e.g. server-to-server call, curl) → always allowed;
 *   there's no browser same-origin policy to enforce there.
 * - `allowedOrigins` includes `'*'` (the default) → any origin allowed.
 * - Otherwise the origin must be an exact match in the list.
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[] = DEFAULT_ALLOWED_ORIGINS): boolean {
  if (!origin) return true;
  const list = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
  if (list.includes('*')) return true;
  return list.some((allowed) => allowed.trim().replace(/\/$/, '') === origin.trim().replace(/\/$/, ''));
}

/**
 * Builds the CORS response headers for a given request origin + a chatbot's
 * configured allowed origins. Call this for both the OPTIONS preflight
 * response and the actual POST/GET response.
 */
export function buildCorsHeaders(origin: string | null, allowedOrigins: string[] = DEFAULT_ALLOWED_ORIGINS): HeadersInit {
  const list = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
  const allowAll = list.includes('*');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  };

  if (allowAll) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && isOriginAllowed(origin, list)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/**
 * CORS headers for an OPTIONS preflight on the public widget API. Since the
 * widget API key (which identifies the chatbot, and therefore its specific
 * `allowedOrigins`) is only sent on the real request — never on a preflight
 * — we can't look up a per-chatbot allow-list here. Preflight is permissive
 * (echoes whatever Origin asked); the actual POST/GET response is what
 * enforces the real per-chatbot allow-list via `buildCorsHeaders` above, so
 * a disallowed origin still can't read the real response even though its
 * preflight succeeded.
 */
export function buildPreflightCorsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
    ...(origin ? { Vary: 'Origin' } : {}),
  };
}
