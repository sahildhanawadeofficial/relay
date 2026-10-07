import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import ChatbotPageClient from '@/components/chatbot/ChatbotPageClient';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    <div className="min-h-screen bg-mesh page-grid flex flex-col">
      {/* TOP HEADER */}
      <header className="app-header">
        <div className="app-header-inner app-header-inner--wide">
          <div className="flex items-center gap-4 min-w-0">
            <BrandLogo size="sm" />
            <div className="w-px h-6 bg-line hidden sm:block" />
            <Link
              href="/dashboard"
              id="back-to-dashboard-btn"
              className="flex items-center gap-1.5 text-mute hover:text-ink transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>

            <div className="w-px h-5 bg-fill" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg brand-logo-mark flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {serializedChatbot.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-semibold text-ink leading-tight">
                  {serializedChatbot.name}
                </h1>
                <p className="text-xs text-faint font-mono">
                  {serializedChatbot.uuid.split('-')[0]}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
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
