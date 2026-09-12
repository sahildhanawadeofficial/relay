# Relay

Relay is the Next.js app for the multi-tenant AI chatbot platform — UI, authentication, document management, RAG chat, and the embeddable widget API.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Run `npm install`.
3. Start development server: `npm run dev`.

## Environment Variables

- `MONGODB_URI`: Connection string to MongoDB
- `AUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Base URL for NextAuth.js
- `PYTHON_RAG_SERVICE_URL`: URL of the Python RAG service
- `PYTHON_RAG_SERVICE_API_KEY`: API key for the Python RAG service

## Tests

Run tests using `npm test`.
