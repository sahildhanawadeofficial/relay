import Link from 'next/link';

interface ChatbotData {
  uuid: string;
  name: string;
  createdAt: string;
}

export default function ChatbotCard({ chatbot }: { chatbot: ChatbotData }) {
  const date = new Date(chatbot.createdAt).toLocaleDateString();
  const shortId = chatbot.uuid.split('-')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{chatbot.name}</h3>
        <p className="text-sm text-gray-500 mb-4">
          ID: {shortId}... • Created {date}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
        <Link
          href={`/chatbots/${chatbot.uuid}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Open Chatbot →
        </Link>
      </div>
    </div>
  );
}
