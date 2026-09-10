from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.routes import documents, search

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Any necessary initialization
    yield

app = FastAPI(
    title="Python RAG Service",
    description="Multi-tenant RAG microservice for chatbot platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware('http')
async def verify_api_key(request: Request, call_next):
    if request.url.path in ['/health', '/docs', '/openapi.json', '/redoc']:
        return await call_next(request)
    api_key = request.headers.get('x-api-key')
    if api_key != settings.python_service_api_key:
        return JSONResponse(status_code=401, content={'error': 'Unauthorized'})
    return await call_next(request)

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(search.router, prefix="/search", tags=["search"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
