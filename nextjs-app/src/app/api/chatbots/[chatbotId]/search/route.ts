import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { searchChatbot } from '@/lib/python-service';

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
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const result = await searchChatbot(chatbotId, query, top_k || 5);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to search chatbot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
