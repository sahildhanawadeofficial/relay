import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Chatbot } from '@/models/Chatbot';
import DashboardClient from '@/components/dashboard/DashboardClient';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Chatbots</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Signed in as {session.user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">Sign Out</button>
            </form>
          </div>
        </header>
        <DashboardClient initialChatbots={serializedChatbots} />
      </div>
    </div>
  );
}
