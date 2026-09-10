import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import ChatbotPageClient from '@/components/chatbot/ChatbotPageClient';

export const dynamic = 'force-dynamic';

export default async function ChatbotPage({ params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  await dbConnect();
  const chatbot = await Chatbot.findOne({ uuid: chatbotId }).lean();

  if (!chatbot || chatbot.userId.toString() !== session.user.id) {
    redirect('/dashboard');
  }

  const serializedChatbot = {
    uuid: chatbot.uuid,
    name: chatbot.name,
    createdAt: chatbot.createdAt.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{serializedChatbot.name}</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">ID: {serializedChatbot.uuid}</p>
        </div>
        <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to Dashboard
        </a>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ChatbotPageClient chatbot={serializedChatbot} />
      </main>
    </div>
  );
}
