from fastapi import APIRouter, UploadFile, Form, HTTPException
from app.models.schemas import IngestionResponse
from app.services.document_service import ingest_document
from app.utils.document_parser import is_supported
import uuid

router = APIRouter()

@router.post('/', response_model=IngestionResponse)
async def upload_document(
    file: UploadFile,
    chatbot_id: str = Form(...),
):
    try:
        uuid.UUID(chatbot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid chatbot_id format')
    
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file provided')
    
    if not is_supported(file.filename):
        raise HTTPException(
            status_code=400,
            detail='Unsupported file type. Supported: PDF, DOCX, TXT'
        )
    
    try:
        result = await ingest_document(file, chatbot_id)
        return IngestionResponse(
            message='Document processed successfully',
            chatbot_id=chatbot_id,
            document_name=result['document_name'],
            chunks_processed=result['chunks_processed'],
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Document processing failed: {str(e)}')
