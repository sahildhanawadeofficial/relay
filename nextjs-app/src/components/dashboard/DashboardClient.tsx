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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="section-label mb-1">Library</p>
          <h2 className="text-lg font-semibold text-ink">
            {chatbots.length > 0
              ? `${chatbots.length} Chatbot${chatbots.length !== 1 ? 's' : ''}`
              : 'No chatbots yet'}
          </h2>
        </div>
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
        <div className="empty-state glass-card-static p-14 md:p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl icon-ring text-3xl mb-5 mx-auto">🤖</div>
          <h3 className="text-xl font-semibold text-ink mb-2">Create your first chatbot</h3>
          <p className="text-mute mb-8 max-w-sm mx-auto text-sm leading-relaxed">
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
