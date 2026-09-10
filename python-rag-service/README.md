# Python FastAPI RAG Service

A multi-tenant RAG microservice for an AI chatbot platform.

## Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in the values
4. Run the app: `uvicorn app.main:app --reload`

## Testing
Run `pytest` to execute all unit tests.

## API Keys
Ensure `PYTHON_SERVICE_API_KEY` is set in your `.env` file. It must be provided via the `x-api-key` header on all protected endpoints.
