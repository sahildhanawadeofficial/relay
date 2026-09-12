import { randomBytes } from 'crypto';

/**
 * Generates a public API key for a chatbot's embeddable widget.
 * Prefixed with `pk_live_` (public key) so it's visually distinguishable
 * from server-only secrets (e.g. PINECONE_API_KEY, OPENROUTER_API_KEY).
 * This key is meant to be embedded in client-side JS on external websites,
 * so it is NOT a secret in the traditional sense — access control for the
 * public widget API is layered via `allowedOrigins` + rate limiting instead.
 */
export function generateApiKey(): string {
  return `pk_live_${randomBytes(24).toString('hex')}`;
}
