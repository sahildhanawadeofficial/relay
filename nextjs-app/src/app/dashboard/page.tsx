import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  await dbConnect();

  const chatbots = await Chatbot.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const serializedChatbots = chatbots.map((bot: any) => ({
    _id: bot._id.toString(),
    uuid: bot.uuid,
    name: bot.name,
    createdAt: bot.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-mesh page-grid">
      <AppHeader>
        <ThemeToggle compact />
        <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-line ml-1">
          <div className="w-8 h-8 rounded-full brand-logo-mark flex items-center justify-center text-white text-xs font-semibold">
            {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm text-mute max-w-[200px] truncate">{session.user.email}</span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button id="signout-btn" className="btn-ghost text-xs py-1.5 px-3">
            Sign Out
          </button>
        </form>
      </AppHeader>

      {/* PAGE CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="mb-10 animate-fade-in-up">
          <p className="section-label mb-2">Dashboard</p>
          <h1 className="page-heading text-3xl md:text-4xl font-extrabold text-ink mb-2">
            {session.user.name ? `Hi, ${session.user.name.split(' ')[0]}` : 'Your Chatbots'}
          </h1>
          <p className="text-mute max-w-xl">
            Create a chatbot, upload documents, and start getting grounded answers with source citations.
          </p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up stagger">
          {[
            { label: 'Chatbots', value: serializedChatbots.length, icon: '🤖', tone: 'indigo' },
            { label: 'Status', value: 'Active', icon: '✅', tone: 'emerald' },
            { label: 'LLM', value: 'GPT-4o mini', icon: '🧠', tone: 'violet' },
            { label: 'Embeddings', value: 'OpenAI', icon: '⚡', tone: 'amber' },
          ].map((stat) => (
            <div key={stat.label} className={`stat-tile stat-tile--${stat.tone} animate-fade-in-up`}>
              <div className={`stat-tile-icon stat-tile-icon--${stat.tone}`} aria-hidden>
                {stat.icon}
              </div>
              <div className="text-xl font-bold text-ink tracking-tight">{stat.value}</div>
              <div className="text-xs text-mute mt-1 uppercase tracking-wide font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        <DashboardClient initialChatbots={serializedChatbots} />
      </main>
    </div>
  );
}
