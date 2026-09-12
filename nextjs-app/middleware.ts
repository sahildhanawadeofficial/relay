import NextAuth from 'next-auth';
import { authConfig } from './src/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // api/public/* is the embeddable widget's API (authenticated via a
  // per-chatbot apiKey, not a session) — skip session middleware entirely
  // so cross-origin widget calls aren't slowed down or complicated by it.
  matcher: ['/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|login|register).*)'],
};
