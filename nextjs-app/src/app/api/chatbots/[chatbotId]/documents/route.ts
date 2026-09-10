import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import { ingestDocument } from '@/lib/python-service';

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
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.' }, { status: 400 });
    }
    
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);
    pythonFormData.append('chatbot_id', chatbotId);
    
    const result = await ingestDocument(pythonFormData);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
