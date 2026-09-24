import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { extractText, isSupportedFile } from '@/lib/parser';
import { chunkDocument } from '@/lib/chunker';
import { embedTexts, upsertVectors, PineconeRecord } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// In-memory chunk store: uploadId -> { chunks, totalChunks, fileName }
// Works for sequential uploads within a Vercel instance lifetime.
const chunkStore = new Map<
  string,
  { chunks: (Buffer | null)[]; totalChunks: number; fileName: string }
>();

// ─────────────────────────────────────────────────────────────────
// POST /api/chatbots/[chatbotId]/documents
//
// Supports two modes:
//   1. Single-shot  — formData with `file` (for files < 4 MB)
//   2. Chunked      — formData with `chunk`, `uploadId`, `chunkIndex`,
//                     `totalChunks`, `fileName` (for larger files)
// ─────────────────────────────────────────────────────────────────
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
    const uploadId = formData.get('uploadId') as string | null;

    // ── Chunked upload path ──────────────────────────────────────
    if (uploadId) {
      const chunkIndexStr = formData.get('chunkIndex') as string | null;
      const totalChunksStr = formData.get('totalChunks') as string | null;
      const fileName = formData.get('fileName') as string | null;
      const chunkBlob = formData.get('chunk') as File | null;

      if (!chunkIndexStr || !totalChunksStr || !fileName || !chunkBlob) {
        return NextResponse.json({ error: 'Missing chunked upload fields' }, { status: 400 });
      }

      if (!isSupportedFile(fileName)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.' },
          { status: 400 }
        );
      }

      const chunkIndex = parseInt(chunkIndexStr, 10);
      const totalChunks = parseInt(totalChunksStr, 10);

      if (!chunkStore.has(uploadId)) {
        chunkStore.set(uploadId, {
          chunks: new Array(totalChunks).fill(null),
          totalChunks,
          fileName,
        });
      }

      const entry = chunkStore.get(uploadId)!;
      entry.chunks[chunkIndex] = Buffer.from(await chunkBlob.arrayBuffer());

      const receivedCount = entry.chunks.filter((c) => c !== null).length;

      // Still waiting for more chunks
      if (receivedCount < totalChunks) {
        return NextResponse.json(
          { received: receivedCount, total: totalChunks, status: 'partial' },
          { status: 200 }
        );
      }

      // All chunks received — reassemble and process
      const fullBuffer = Buffer.concat(entry.chunks as Buffer[]);
      chunkStore.delete(uploadId);

      return await processDocument(fullBuffer, fileName, chatbotId);
    }

    // ── Single-shot upload path (files < ~4 MB) ──────────────────
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

    const buffer = Buffer.from(await file.arrayBuffer());
    return await processDocument(buffer, file.name, chatbotId);
  } catch (error: any) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared pipeline: extract text → chunk → embed → upsert to Pinecone
// ─────────────────────────────────────────────────────────────────
async function processDocument(buffer: Buffer, fileName: string, chatbotId: string) {
  const text = await extractText(buffer, fileName);
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Document contains no extractable text' }, { status: 422 });
  }

  const documentId = uuidv4();
  const chunks = chunkDocument(text, {
    chatbot_id: chatbotId,
    document_id: documentId,
    document_name: fileName,
  });

  if (chunks.length === 0) {
    return NextResponse.json({ error: 'Document contains no readable content to chunk' }, { status: 422 });
  }

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  const vectors: PineconeRecord[] = chunks.map((chunk, i) => ({
    id: `${chatbotId}_${documentId}_${chunk.chunk_id}`,
    values: embeddings[i],
    metadata: {
      chatbot_id: chatbotId,
      document_id: documentId,
      document_name: fileName,
      chunk_id: chunk.chunk_id,
      text: chunk.text,
    },
  }));

  await upsertVectors(vectors);

  return NextResponse.json(
    {
      message: 'Document processed successfully',
      chatbot_id: chatbotId,
      document_name: fileName,
      chunks_processed: chunks.length,
    },
    { status: 200 }
  );
}
