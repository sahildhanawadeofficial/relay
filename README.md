# Multi-Tenant AI Chatbot Platform

A production-ready multi-tenant AI chatbot platform that allows users to create independent chatbots, each with its own document-based RAG knowledge base.

## Architecture

```
┌─────────────────────────────────────────────┐
│             NEXT.JS MICROSERVICE            │
│                                             │
│  Authentication / Authorization (Auth.js)   │
│  MongoDB + Mongoose                         │
│  User & Chatbot Management                  │
│  Document Upload UI                         │
│  Chat Interface                             │
└──────────────────────┬──────────────────────┘
                       │ HTTP API (x-api-key)
                       ▼
┌─────────────────────────────────────────────┐
│             PYTHON MICROSERVICE             │
│                                             │
│  FastAPI                                    │
│  Document ingestion (PDF/DOCX/TXT)          │
│  OpenAI embeddings                          │
│  Pinecone vector storage                    │
│  Vector search (per-chatbot filtered)       │
│  RAG answer generation                      │
└─────────────────────────────────────────────┘
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
        ┌─────────┐          ┌──────────┐
        │Pinecone │          │  OpenAI  │
        │Vectors  │          │  API     │
        └─────────┘          └──────────┘
```

## Repository Structure

```
chatbot-platform/
├── nextjs-app/          # Next.js 15 + Auth.js v5 + MongoDB
├── python-rag-service/  # FastAPI + Pinecone + OpenAI RAG
├── docker-compose.yml
└── README.md
```

## Technology Stack

### Next.js Service
| Technology | Version |
|---|---|
| Next.js | 15.x |
| React | 19.x |
| TypeScript | 5.x |
| Auth.js (NextAuth) | 5.x (beta) |
| Mongoose | 8.x |
| bcryptjs | 2.x |
| Tailwind CSS | 3.x |

### Python Service
| Technology | Version |
|---|---|
| Python | 3.11+ |
| FastAPI | ≥ 0.115 |
| Pinecone SDK | ≥ 6.0 |
| OpenAI SDK | ≥ 1.50 |
| Pydantic | ≥ 2.9 |

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional, for containerized setup)
- MongoDB (local or Atlas)
- OpenAI API key
- Pinecone account + API key

---

## Setup Instructions

### 1. Clone / Open Repository

```bash
cd "rp project"
```

### 2. Set Up Pinecone Index

1. Log in to [app.pinecone.io](https://app.pinecone.io)
2. Create a new index:
   - **Name**: `chatbot-platform` (or any name — set in `PINECONE_INDEX_NAME`)
   - **Dimensions**: `1536` (for `text-embedding-3-small`)
   - **Metric**: `cosine`
   - **Spec**: Serverless (recommended) or Pod

### 3. Environment Variables

#### Next.js (`nextjs-app/.env.local`)
```env
MONGODB_URI=mongodb://localhost:27017/chatbot-platform
AUTH_SECRET=<generate with: npx auth secret>
NEXTAUTH_URL=http://localhost:3000
PYTHON_RAG_SERVICE_URL=http://localhost:8000
PYTHON_RAG_SERVICE_API_KEY=your-strong-random-api-key
```

#### Python (`python-rag-service/.env`)
```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini

PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=chatbot-platform
PINECONE_NAMESPACE=default

PYTHON_SERVICE_API_KEY=your-strong-random-api-key  # MUST match Next.js PYTHON_RAG_SERVICE_API_KEY

CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7
```

> **Important**: `PYTHON_SERVICE_API_KEY` in the Python service must exactly match `PYTHON_RAG_SERVICE_API_KEY` in the Next.js service.

---

## Running Locally

### Option A: Docker Compose (Recommended)

```bash
# Copy and fill in env files first
cp nextjs-app/.env.example nextjs-app/.env
cp python-rag-service/.env.example python-rag-service/.env
# Edit both .env files with your real credentials

docker compose up --build
```

Services:
- Next.js: http://localhost:3000
- Python RAG: http://localhost:8000
- MongoDB: localhost:27017

### Option B: Manual Local Dev

**Start MongoDB:**
```bash
# Using Docker:
docker run -d -p 27017:27017 --name mongo mongo:7.0
# Or use MongoDB Atlas connection string
```

**Start Python Service:**
```bash
cd python-rag-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your credentials
uvicorn app.main:app --reload --port 8000
```

**Start Next.js App:**
```bash
cd nextjs-app
npm install
cp .env.example .env.local   # Fill in your credentials
npm run dev
```

---

## API Documentation

### Python Service APIs (internal — called by Next.js only)

All requests require: `x-api-key: <PYTHON_SERVICE_API_KEY>`

#### POST /documents
Ingest a document into a chatbot's knowledge base.

**Request** (multipart/form-data):
```
file: <binary file — PDF, DOCX, or TXT>
chatbot_id: 550e8400-e29b-41d4-a716-446655440000
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

#### POST /search
Run a RAG search against a chatbot's knowledge base.

**Request:**
```json
{
  "chatbot_id": "550e8400-e29b-41d4-a716-446655440000",
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

#### GET /health
```json
{ "status": "healthy" }
```

---

## Testing

### Python Tests
```bash
cd python-rag-service
pip install -r requirements.txt
pytest tests/ -v --tb=short
```

### Next.js Tests
```bash
cd nextjs-app
npm test
```

---

## Multi-Tenant Isolation

Every document vector stored in Pinecone includes `chatbot_id` in its metadata:
```json
{
  "chatbot_id": "uuid-of-chatbot",
  "document_name": "file.pdf",
  "chunk_id": 0,
  "text": "chunk text..."
}
```

Every Pinecone search applies a server-side metadata filter:
```python
filter={"chatbot_id": {"$eq": chatbot_id}}
```

This guarantees that **Chatbot A can never retrieve documents from Chatbot B or C**, even if they share the same Pinecone index.

---

## Security

- Passwords hashed with bcrypt (12 rounds) — never stored plaintext
- All chatbot routes verify `chatbot.userId === authenticated user id` server-side
- Python service rejects all requests without a valid `x-api-key` header
- No secrets, stack traces, or internal details exposed in error responses
- NextAuth JWT sessions — no server-side session storage required

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `MONGODB_URI is not defined` | Add `MONGODB_URI` to `.env.local` |
| `AUTH_SECRET is not defined` | Run `npx auth secret` and add the output to `.env.local` |
| Pinecone dimension mismatch | Ensure Pinecone index dimension = 1536 for `text-embedding-3-small` |
| Python service 401 | Check `PYTHON_SERVICE_API_KEY` matches `PYTHON_RAG_SERVICE_API_KEY` |
| `No module named pydantic_settings` | Run `pip install pydantic-settings` |
| Next.js build errors | Run `npm install` then `npm run build` |
