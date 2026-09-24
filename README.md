# Multi-Tenant AI Chatbot Platform

A production-ready multi-tenant AI chatbot platform that allows users to create independent chatbots, each with its own document-based RAG knowledge base.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  NEXT.JS APP (single service)         │
│                                                      │
│  Authentication / Authorization (Auth.js v5)         │
│  MongoDB + Mongoose — users & chatbot config         │
│  Document Upload & Chunking (PDF / DOCX / TXT)       │
│  Pinecone Native Embeddings (hosted inference)       │
│  Vector Search (per-chatbot metadata filter)         │
│  RAG Answer Generation (OpenRouter LLM)              │
│  Chat Interface & Embed Widget                       │
└───────────────────────┬──────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
      ┌──────────┐           ┌─────────────┐
      │ Pinecone │           │  OpenRouter │
      │  Vector  │           │    LLM API  │
      │   DB +   │           │  (Llama 3,  │
      │ Inference│           │  GPT, etc.) │
      └──────────┘           └─────────────┘
```

> **No Python service.** Embeddings are generated entirely through **Pinecone's built-in hosted inference API** (`pc.inference.embed`) — no OpenAI embedding credits needed. LLM answers are generated via **OpenRouter** (free-tier models available).

## Repository Structure

```
research project/
├── nextjs-app/   # Next.js 15 + Auth.js v5 + MongoDB + Pinecone
└── README.md
```

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 15 | Full-stack framework (API routes + UI) |
| React 19 | Frontend UI |
| TypeScript 5 | Type safety |
| Auth.js (NextAuth) v5 | Authentication (credentials + Google OAuth) |
| Mongoose 8 | MongoDB ODM — users & chatbot config |
| Pinecone SDK | Vector storage + **native hosted embeddings** |
| OpenRouter API | LLM answer generation (free-tier models) |
| Tailwind CSS 3 | Styling |

---

## Prerequisites

- **Node.js 20+**
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Pinecone account** — [app.pinecone.io](https://app.pinecone.io) (free tier works)
- **OpenRouter account** — [openrouter.ai](https://openrouter.ai) (free-tier API key)
- **Google Cloud credentials** *(optional)* — for Google OAuth login

---

## Setup Instructions

### 1. Set Up Pinecone Index

1. Log in to [app.pinecone.io](https://app.pinecone.io)
2. Create a new **Serverless** index:
   - **Name**: `chatbot-platform` (or any name — set in `PINECONE_INDEX_NAME`)
   - **Model**: Choose a hosted embedding model, e.g. **`multilingual-e5-large`**
   - **Metric**: `cosine`

   > The index dimensions are set automatically by Pinecone when you use a hosted model — you do **not** need to specify a dimension manually.

3. After creation, copy the **Index Host** URL from the dashboard — you'll need it for `PINECONE_INDEX_HOST`.

### 2. Environment Variables

Create `nextjs-app/.env` (copy from `.env.example`):

```env
MONGODB_URI=mongodb://localhost:27017/chatbot-platform
AUTH_SECRET=<generate with: npx auth secret>
NEXTAUTH_URL=http://localhost:3000

# Pinecone Vector DB & Native Embeddings
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=chatbot-platform
PINECONE_INDEX_HOST=https://chatbot-platform-xxxx.svc.aped-xxxx.pinecone.io
PINECONE_NAMESPACE=default
PINECONE_EMBEDDING_MODEL=multilingual-e5-large

# OpenRouter (free-tier LLM for RAG answer generation)
# Get a key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
OPENROUTER_FALLBACK_MODELS=openai/gpt-oss-120b:free,deepseek/deepseek-r1:free,openrouter/free

# Google OAuth (optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. Install & Run

```bash
cd nextjs-app
npm install
npm run dev
```

App runs at **http://localhost:3000**.

---

## How RAG Works (end-to-end)

### Document Ingestion

```
User uploads file (PDF / DOCX / TXT)
        │
        ▼
  Text extraction (parser.ts)
        │
        ▼
  Text chunking — ~1000 chars with overlap (chunker.ts)
        │
        ▼
  pc.inference.embed(chunks)   ← Pinecone hosted inference
        │
        ▼
  index.upsert(vectors + metadata)  ← stored in Pinecone
```

### Query / Answer

```
User sends question
        │
        ▼
  pc.inference.embed(question)  ← same model, inputType: "query"
        │
        ▼
  index.query(vector, filter: { chatbot_id })  ← filtered search
        │
        ▼
  Top-K matching chunks retrieved
        │
        ▼
  OpenRouter LLM (Llama 3 / GPT-OSS / etc.)
  prompted with: question + retrieved chunks
        │
        ▼
  Grounded answer returned to user with source citations
```

---

## API Routes

All routes are **Next.js App Router API handlers** (`src/app/api/`). Auth is enforced via Auth.js session cookies.

### `POST /api/chatbots/[chatbotId]/documents`
Upload a document into a chatbot's knowledge base. Supports **chunked uploads** for files larger than 4 MB.

**Request** (multipart/form-data):

_Single-shot (< 4 MB):_
```
file: <binary — PDF, DOCX, or TXT>
```

_Chunked (≥ 4 MB):_
```
chunk:       <binary slice of the file>
uploadId:    <unique ID shared across all chunks>
chunkIndex:  <0-based index of this chunk>
totalChunks: <total number of chunks>
fileName:    <original file name>
```

**Response 200:**
```json
{
  "message": "Document processed successfully",
  "chatbot_id": "550e8400-e29b-41d4-a716-446655440000",
  "document_name": "company-policy.pdf",
  "chunks_processed": 12
}
```

---

### `POST /api/chatbots/[chatbotId]/search`
Ask a question against a chatbot's knowledge base.

**Request:**
```json
{
  "query": "What is the leave policy?",
  "top_k": 5
}
```

**Response 200:**
```json
{
  "chatbot_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "What is the leave policy?",
  "answer": "According to the documents, employees are entitled to...",
  "sources": [
    { "document_name": "leave-policy.pdf", "chunk_id": 4, "score": 0.91 },
    { "document_name": "employee-handbook.pdf", "chunk_id": 2, "score": 0.87 }
  ]
}
```

---

## Multi-Tenant Isolation

Every vector stored in Pinecone carries `chatbot_id` in its metadata:

```json
{
  "chatbot_id": "uuid-of-chatbot",
  "document_id": "uuid-of-document",
  "document_name": "file.pdf",
  "chunk_id": 0,
  "text": "chunk text..."
}
```

Every Pinecone query applies a server-side metadata filter:

```ts
filter: { chatbot_id: { $eq: chatbotId } }
```

This guarantees **Chatbot A can never retrieve documents belonging to Chatbot B or C**, even if they share the same Pinecone index and namespace.

---

## Security

- Passwords hashed with **bcrypt (12 rounds)** — never stored plaintext
- All chatbot API routes verify `chatbot.userId === authenticated user id` server-side
- Auth.js **JWT sessions** — no server-side session storage required
- No secrets, stack traces, or internal details exposed in error responses

---

## Testing

```bash
cd nextjs-app
npm test
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `MONGODB_URI is not defined` | Add `MONGODB_URI` to `nextjs-app/.env` |
| `AUTH_SECRET is not defined` | Run `npx auth secret` and add output to `.env` |
| `PINECONE_API_KEY is not defined` | Add your Pinecone API key to `.env` |
| Pinecone inference 404 / model not found | Check `PINECONE_EMBEDDING_MODEL` matches a model enabled in your Pinecone project |
| OpenRouter 401 | Verify `OPENROUTER_API_KEY` starts with `sk-or-v1-` |
| `413 Content Too Large` on Vercel | File is split into 3.5 MB chunks automatically — ensure you are on the latest code |
| Next.js build errors | Run `npm install` then `npm run build` |

