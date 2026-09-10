'use client';

import { useState, useRef } from 'react';

interface ChatbotData {
  uuid: string;
  name: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: { document_name: string; chunk_id: number; score: number }[];
}

export default function ChatbotPageClient({ chatbot }: { chatbot: ChatbotData }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'uploading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadStatus({ type: 'uploading', message: 'Uploading and processing document...' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setUploadStatus({ type: 'success', message: `Successfully processed ${data.chunks_processed || 0} chunks.` });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSearching) return;
    
    const query = input.trim();
    setInput('');
    
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: query }]);
    setIsSearching(true);
    
    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 5 }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Search failed');
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        content: data.answer,
        sources: data.sources 
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        content: `Error: ${err.message}` 
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full h-[calc(100vh-80px)]">
      {/* Sidebar: Documents */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Knowledge Base</h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Document</h3>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3"
            accept=".pdf,.docx,.txt"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploadStatus.type === 'uploading'}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadStatus.type === 'uploading' ? 'Processing...' : 'Upload to Knowledge Base'}
          </button>
          
          {uploadStatus.message && (
            <div className={`mt-3 p-2 rounded text-xs ${
              uploadStatus.type === 'error' ? 'bg-red-50 text-red-600' :
              uploadStatus.type === 'success' ? 'bg-green-50 text-green-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p>No messages yet. Ask a question about your documents!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-4 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 shadow-sm text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Sources:</p>
                      <ul className="space-y-1">
                        {msg.sources.map((src, i) => (
                          <li key={i} className="text-xs text-gray-500 truncate bg-gray-50 px-2 py-1 rounded">
                            {src.document_name} (Chunk: {src.chunk_id}, Score: {src.score.toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isSearching && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500 animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSearching}
              className="bg-blue-600 text-white rounded-full px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
