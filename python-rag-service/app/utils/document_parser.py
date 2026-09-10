import pdfplumber
from docx import Document
from pathlib import Path

SUPPORTED_TYPES = {'.pdf', '.docx', '.txt'}

def extract_text(file_path: str, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == '.pdf':
        return _parse_pdf(file_path)
    elif suffix == '.docx':
        return _parse_docx(file_path)
    elif suffix == '.txt':
        return _parse_txt(file_path)
    else:
        raise ValueError(f'Unsupported file type: {suffix}')

def _parse_pdf(path: str) -> str:
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text.append(extracted)
    return "\n".join(text)

def _parse_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()])

def _parse_txt(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def is_supported(filename: str) -> bool:
    return Path(filename).suffix.lower() in SUPPORTED_TYPES
