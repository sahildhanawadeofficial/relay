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

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Create Chatbot
        </button>
      </div>

      {chatbots.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No chatbots yet</h3>
          <p className="text-gray-500">Create your first chatbot to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((bot) => (
            <ChatbotCard key={bot.uuid} chatbot={bot} />
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
