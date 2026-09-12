import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import ChatbotPageClient from '@/components/chatbot/ChatbotPageClient';
import Link from 'next/link';

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
    apiKey: chatbot.apiKey ?? null,
    allowedOrigins: chatbot.allowedOrigins ?? ['*'],
    widgetConfig: {
      position: chatbot.widgetConfig?.position ?? 'bottom-right',
      primaryColor: chatbot.widgetConfig?.primaryColor ?? '#4f46e5',
      welcomeMessage: chatbot.widgetConfig?.welcomeMessage ?? 'Hi! How can I help you today?',
    },
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(5,5,15,0.85)] backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              id="back-to-dashboard-btn"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>

            <div className="w-px h-5 bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {serializedChatbot.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">
                  {serializedChatbot.name}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  {serializedChatbot.uuid.split('-')[0]}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-green hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Ready
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden">
        <ChatbotPageClient chatbot={serializedChatbot} />
      </main>
    </div>
  );
}
