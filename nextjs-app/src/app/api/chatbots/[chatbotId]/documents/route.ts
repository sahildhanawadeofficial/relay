import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { extractText, isSupportedFile } from '@/lib/parser';
import { chunkDocument } from '@/lib/chunker';
import { embedTexts, upsertVectors, PineconeRecord } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const chatbot = await Chatbot.findOne({ uuid: chatbotId });
    
    if (!chatbot) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    if (chatbot.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!isSupportedFile(file.name)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.' },
        { status: 400 }
      );
    }

    // 1. Read binary content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text from document
    const text = await extractText(buffer, file.name);
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Document contains no extractable text' }, { status: 422 });
    }

    // 3. Chunk text into segments
    const documentId = uuidv4();
    const chunks = chunkDocument(text, {
      chatbot_id: chatbotId,
      document_id: documentId,
      document_name: file.name,
    });

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Document contains no readable content to chunk' }, { status: 422 });
    }

    // 4. Generate embeddings using Pinecone's native hosted inference
    const texts = chunks.map((c) => c.text);
    const embeddings = await embedTexts(texts);

    // 5. Upsert into Pinecone
    const vectors: PineconeRecord[] = chunks.map((chunk, i) => ({
      id: `${chatbotId}_${documentId}_${chunk.chunk_id}`,
      values: embeddings[i],
      metadata: {
        chatbot_id: chatbotId,
        document_id: documentId,
        document_name: file.name,
        chunk_id: chunk.chunk_id,
        text: chunk.text,
      },
    }));

    await upsertVectors(vectors);

    return NextResponse.json(
      {
        message: 'Document processed successfully',
        chatbot_id: chatbotId,
        document_name: file.name,
        chunks_processed: chunks.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
