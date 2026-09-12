import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { generateApiKey } from '@/lib/apiKey';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const chatbots = await Chatbot.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json(chatbots);
  } catch (error) {
    console.error('Failed to fetch chatbots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const CreateChatbotSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const result = CreateChatbotSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }
    
    await dbConnect();
    const chatbot = await Chatbot.create({
      name: result.data.name,
      uuid: uuidv4(),
      userId: session.user.id,
      // Every chatbot gets a public API key up front so the "Embed & API"
      // tab has something to show immediately, without a separate step.
      apiKey: generateApiKey(),
    });
    
    return NextResponse.json(chatbot, { status: 201 });
  } catch (error) {
    console.error('Failed to create chatbot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
