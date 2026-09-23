# Relay

Relay is a multi-tenant AI chatbot platform. A signed-in owner creates a chatbot, uploads documents, and asks questions against that private knowledge base. The same chatbot can be embedded on any website with one public API key.

Live app: [https://relayy-dun.vercel.app](https://relayy-dun.vercel.app)

The embeddable chat button is a separate npm package: [`relay-chat-widget`](https://www.npmjs.com/package/relay-chat-widget) (in the `chatbot-widget` folder).

## What this app does

- Google sign-in for chatbot owners
- Create and manage multiple chatbots per account
- Upload PDF, DOCX, and TXT into a chatbot's private knowledge base
- Answer questions with retrieval-augmented generation (RAG): embed the question, search that chatbot's chunks in Pinecone, then ask an LLM on OpenRouter to write a normal answer
- Embed settings per chatbot: API key, allowed website origins, icon position, color, and welcome message
- Public widget API so an external site can chat without a user session

Owners use the dashboard. Website visitors use the widget. Both paths call the same answer pipeline.

## How a question is answered

1. The question is embedded with Pinecone's hosted embedding model.
2. Pinecone returns the closest text chunks for that chatbot only.
3. OpenRouter turns those chunks into a short conversational answer.
4. The dashboard or widget shows that answer (and source names when available).

## Public API

Authenticated with the chatbot's API key (`Authorization: Bearer pk_live_...` or `x-api-key`). The key identifies the chatbot. Callers do not send an internal chatbot id.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/config` | Widget appearance: name, position, color, welcome message |
| POST | `/api/public/chat` | Body `{ "query": "...", "top_k": 5 }` returns `{ answer, sources }` |
| OPTIONS | both | CORS preflight |

Allowed origins default to `*` so a new widget works immediately. Lock this to your site in the chatbot's Embed & API tab.

## Setup

1. Use Node.js 20+.
2. Copy `.env.example` to `.env` and fill in the values.
3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Google OAuth redirect URL for local development: `http://localhost:3000/api/auth/callback/google`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth secret |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` or your Vercel URL |
| `AUTH_GOOGLE_ID` | Google OAuth client id |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name |
| `PINECONE_INDEX_HOST` | Pinecone index host |
| `PINECONE_NAMESPACE` | Namespace inside the index |
| `PINECONE_EMBEDDING_MODEL` | Embedding model, e.g. `multilingual-e5-large` |
| `OPENROUTER_API_KEY` | OpenRouter key (`sk-or-v1-...`) |
| `OPENROUTER_LLM_MODEL` | Primary model |
| `OPENROUTER_FALLBACK_MODELS` | Comma-separated fallbacks if the primary model is unavailable |

Do not commit `.env`.

## Scripts

```bash
npm run dev     # local server
npm run build   # production build
npm start       # run the production build
npm test        # Jest
```

## Embed a chatbot

1. Sign in and create a chatbot.
2. Upload documents.
3. Open Embed & API and copy the API key.
4. On the customer site, either:
   - `npm install relay-chat-widget` and call `init({ apiKey })`, or
   - add the script tag from the package README.

Widget requests go to this app at `/api/public/config` and `/api/public/chat`. The published package is already pointed at `https://relayy-dun.vercel.app`.
