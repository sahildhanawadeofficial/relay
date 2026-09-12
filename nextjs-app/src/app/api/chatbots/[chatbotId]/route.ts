import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { z } from 'zod';

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

const UpdateChatbotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  // Comma-free array of origins, e.g. ["https://example.com"]. `["*"]` (the
  // default) allows the widget to be embedded on any site.
  allowedOrigins: z.array(z.string().min(1)).min(1).optional(),
  widgetConfig: z
    .object({
      position: z.enum(['bottom-right', 'bottom-left']).optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #4f46e5')
        .optional(),
      welcomeMessage: z.string().min(1).max(500).optional(),
    })
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
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
    const result = UpdateChatbotSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { name, allowedOrigins, widgetConfig } = result.data;

    if (name !== undefined) chatbot.name = name;
    if (allowedOrigins !== undefined) chatbot.allowedOrigins = allowedOrigins;
    if (widgetConfig !== undefined) {
      chatbot.widgetConfig = {
        position: widgetConfig.position ?? chatbot.widgetConfig?.position ?? 'bottom-right',
        primaryColor: widgetConfig.primaryColor ?? chatbot.widgetConfig?.primaryColor ?? '#4f46e5',
        welcomeMessage:
          widgetConfig.welcomeMessage ?? chatbot.widgetConfig?.welcomeMessage ?? 'Hi! How can I help you today?',
      };
    }

    await chatbot.save();

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('Failed to update chatbot:', error);
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
