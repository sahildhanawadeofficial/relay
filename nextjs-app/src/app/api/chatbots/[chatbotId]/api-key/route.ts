import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { generateApiKey } from '@/lib/apiKey';

export const dynamic = 'force-dynamic';

/**
 * Regenerates the chatbot's public widget API key. Any previously issued
 * key (e.g. already embedded on a customer's live website) stops working
 * immediately — the caller is responsible for updating their embed snippet.
 */
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

    chatbot.apiKey = generateApiKey();
    await chatbot.save();

    return NextResponse.json({ apiKey: chatbot.apiKey });
  } catch (error) {
    console.error('Failed to rotate API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
