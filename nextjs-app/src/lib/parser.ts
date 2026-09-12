import path from 'path';

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export function isSupportedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case '.pdf': {
      // unpdf provides a serverless-optimized build of PDF.js that works seamlessly in Next.js
      const { getDocumentProxy, extractText: extractPdfText } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractPdfText(pdf, { mergePages: true });
      return text || '';
    }

    case '.docx': {
      const mammothModule: any = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    case '.txt': {
      return buffer.toString('utf-8');
    }

    default:
      throw new Error(`Unsupported file type: ${ext}. Supported formats: PDF, DOCX, TXT`);
  }
}
