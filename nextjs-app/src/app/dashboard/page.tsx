import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import DashboardClient from '@/components/dashboard/DashboardClient';
import Link from 'next/link';

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
    <div className="min-h-screen bg-mesh">
      {/* TOP NAV */}
      <nav className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(5,5,15,0.85)] backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              R
            </div>
            <span className="font-bold text-white tracking-tight">Relay</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm text-slate-400 hidden sm:block">{session.user.email}</span>
            </div>

            <form action="/api/auth/signout" method="POST">
              <button
                id="signout-btn"
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Your Chatbots
          </h1>
          <p className="text-slate-400">
            Create a chatbot, upload documents, and start getting AI-powered answers.
          </p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up stagger">
          {[
            { label: 'Chatbots', value: serializedChatbots.length, icon: '🤖' },
            { label: 'Status', value: 'Active', icon: '✅' },
            { label: 'LLM', value: 'GPT-4o mini', icon: '🧠' },
            { label: 'Embeddings', value: 'OpenAI', icon: '⚡' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 animate-fade-in-up">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <DashboardClient initialChatbots={serializedChatbots} />
      </main>
    </div>
  );
}
