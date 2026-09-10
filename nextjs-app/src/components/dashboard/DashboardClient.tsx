'use client';

import { useState } from 'react';
import ChatbotCard from './ChatbotCard';
import CreateChatbotModal from './CreateChatbotModal';

interface ChatbotData {
  _id: string;
  uuid: string;
  name: string;
  createdAt: string;
}

export default function DashboardClient({ initialChatbots }: { initialChatbots: ChatbotData[] }) {
  const [chatbots, setChatbots] = useState<ChatbotData[]>(initialChatbots);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (newChatbot: ChatbotData) => {
    setChatbots([newChatbot, ...chatbots]);
  };

  const handleDelete = (uuid: string) => {
    setChatbots((prev) => prev.filter((c) => c.uuid !== uuid));
  };

  return (
    <div className="animate-fade-in-up">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          {chatbots.length > 0 ? `${chatbots.length} Chatbot${chatbots.length !== 1 ? 's' : ''}` : 'No Chatbots Yet'}
        </h2>
        <button
          id="create-chatbot-btn"
          onClick={() => setIsModalOpen(true)}
          className="btn-brand"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chatbot
        </button>
      </div>

      {/* EMPTY STATE */}
      {chatbots.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">Create your first chatbot</h3>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
            Give it a name, upload your documents, and start asking questions powered by your own knowledge base.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-brand mx-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Chatbot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {chatbots.map((bot) => (
            <ChatbotCard key={bot.uuid} chatbot={bot} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateChatbotModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
