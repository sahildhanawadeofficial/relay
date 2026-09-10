# Next.js Chatbot Platform Microservice

This microservice handles the UI, authentication, and database operations for the multi-tenant AI chatbot platform. It also acts as an API gateway for the Python RAG service.

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
