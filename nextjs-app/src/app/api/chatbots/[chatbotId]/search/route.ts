import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { embedQuery, queryVectors } from '@/lib/pinecone';
import { generateAnswer, SourceItem } from '@/lib/llm';

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
    
    const body = await request.json();
    const { query, top_k } = body;
    
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const topK = top_k || 5;

    // 1. Generate query embedding using Pinecone native inference
    const queryEmbedding = await embedQuery(query.trim());

    // 2. Query Pinecone vectors filtered by chatbot_id
    const matches = await queryVectors(queryEmbedding, chatbotId, topK);

    // 3. Format sources and context
    const sources: SourceItem[] = matches.map((m) => ({
      document_name: m.metadata.document_name || 'Unknown',
      chunk_id: m.metadata.chunk_id ?? 0,
      score: m.score,
    }));

    const contextParts = matches.map((m, i) => {
      const docName = m.metadata.document_name || 'Unknown';
      const text = m.metadata.text || '';
      return `DOCUMENT ${i + 1} (${docName}):\n${text}`;
    });

    const context = contextParts.join('\n\n');

    // 4. Generate answer
    const answer = await generateAnswer(query.trim(), context, sources);

    return NextResponse.json(
      {
        chatbot_id: chatbotId,
        query: query.trim(),
        answer,
        sources,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to search chatbot:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
