import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
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
    
    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('Failed to fetch chatbot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
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
    
    await Chatbot.deleteOne({ _id: chatbot._id });
    
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete chatbot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
