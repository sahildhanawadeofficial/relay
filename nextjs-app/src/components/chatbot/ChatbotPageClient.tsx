'use client';

import { useState, useRef, useEffect } from 'react';
import EmbedSettings, { WidgetConfig } from './EmbedSettings';

interface ChatbotData {
  uuid: string;
  name: string;
  createdAt?: string;
  apiKey?: string | null;
  allowedOrigins?: string[];
  widgetConfig?: WidgetConfig;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: { document_name: string; chunk_id: number; score: number }[];
}

interface UploadedDoc {
  name: string;
  chunks: number;
  uploadedAt: string;
}

type UploadStatus =
  | { type: 'idle' }
  | { type: 'uploading'; progress: string }
  | { type: 'success'; chunks: number; name: string }
  | { type: 'error'; message: string };

export default function ChatbotPageClient({ chatbot }: { chatbot: ChatbotData }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'embed'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ type: 'idle' });
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearching]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const UPLOAD_STEPS = [
    'Uploading file...',
    'Extracting text...',
    'Chunking document...',
    'Generating embeddings...',
    'Storing in knowledge base...',
  ];

  const handleUpload = async () => {
    if (!file) return;

    let stepIdx = 0;
    setUploadStatus({ type: 'uploading', progress: UPLOAD_STEPS[0] });

    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, UPLOAD_STEPS.length - 1);
      setUploadStatus({ type: 'uploading', progress: UPLOAD_STEPS[stepIdx] });
    }, 1200);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      clearInterval(stepTimer);

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedDocs((prev) => [
        ...prev,
        {
          name: file.name,
          chunks: data.chunks_processed || 0,
          uploadedAt: new Date().toLocaleTimeString(),
        },
      ]);
      setUploadStatus({ type: 'success', chunks: data.chunks_processed || 0, name: file.name });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      clearInterval(stepTimer);
      setUploadStatus({ type: 'error', message: err.message });
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || isSearching) return;

    setInput('');
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: query }]);
    setIsSearching(true);

    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 5 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: `⚠️ ${err.message || 'An error occurred. Please try again.'}`,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-69px)]">
      {/* ─────────── TAB BAR ─────────── */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[rgba(5,5,15,0.6)] px-6">
        <div className="flex gap-6">
          {(
            [
              { id: 'chat', label: '💬 Chat' },
              { id: 'embed', label: '🔌 Embed & API' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-indigo-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'embed' ? (
        <EmbedSettings
          chatbot={{
            uuid: chatbot.uuid,
            name: chatbot.name,
            apiKey: chatbot.apiKey ?? null,
            allowedOrigins: chatbot.allowedOrigins ?? ['*'],
            widgetConfig:
              chatbot.widgetConfig ?? {
                position: 'bottom-right',
                primaryColor: '#4f46e5',
                welcomeMessage: 'Hi! How can I help you today?',
              },
          }}
        />
      ) : (
    <div className="flex flex-1 min-h-0">
      {/* ─────────── SIDEBAR ─────────── */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-[rgba(5,5,15,0.6)]">
        {/* SIDEBAR HEADER */}
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Knowledge Base</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload documents to train this chatbot</p>
        </div>

        {/* UPLOAD AREA */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div
            className={`rounded-xl border-2 border-dashed transition-colors p-4 text-center cursor-pointer ${
              file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/3'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setUploadStatus({ type: 'idle' });
              }}
              className="hidden"
              accept=".pdf,.docx,.txt"
              id="file-upload-input"
            />
            {file ? (
              <>
                <div className="text-2xl mb-1">📄</div>
                <p className="text-xs font-medium text-indigo-300 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl mb-1">⬆️</div>
                <p className="text-xs text-slate-400">
                  Click to select a file
                </p>
                <p className="text-xs text-slate-600 mt-0.5">PDF, DOCX, TXT</p>
              </>
            )}
          </div>

          <button
            id="upload-document-btn"
            onClick={handleUpload}
            disabled={!file || uploadStatus.type === 'uploading'}
            className="btn-brand w-full text-sm py-2"
          >
            {uploadStatus.type === 'uploading' ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </>
            )}
          </button>

          {/* STATUS MESSAGES */}
          {uploadStatus.type === 'uploading' && (
            <div className="alert-info animate-fade-in text-xs">
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {uploadStatus.progress}
              </div>
            </div>
          )}
          {uploadStatus.type === 'success' && (
            <div className="alert-success animate-fade-in text-xs">
              ✅ Processed {uploadStatus.chunks} chunks from {uploadStatus.name}
            </div>
          )}
          {uploadStatus.type === 'error' && (
            <div className="alert-error animate-fade-in text-xs">
              ❌ {uploadStatus.message}
            </div>
          )}
        </div>

        {/* DOCUMENT LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
            Uploaded Documents
          </p>
          {uploadedDocs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2 opacity-30">📭</div>
              <p className="text-xs text-slate-600">No documents yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {uploadedDocs.map((doc, i) => (
                <li key={i} className="glass-card p-3 animate-fade-in-up">
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">
                      {doc.name.endsWith('.pdf') ? '📕' : doc.name.endsWith('.docx') ? '📘' : '📄'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {doc.chunks} chunks · {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ─────────── CHAT MAIN ─────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl mb-4 shadow-lg glow-brand">
                🧠
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ask your knowledge base</h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Upload documents using the sidebar, then ask questions. The AI will search
                your documents and provide answers with source citations.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  'What is the main topic?',
                  'Summarize the key points',
                  'What are the requirements?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 glass-card rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5 shadow">
                  🧠
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-lg'
                    : 'glass-card text-slate-200 rounded-tl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* SOURCE CITATIONS */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 badge badge-brand"
                          title={`Score: ${src.score.toFixed(3)}`}
                        >
                          📄 {src.document_name}
                          <span className="text-indigo-300 opacity-70">
                            ({Math.round(src.score * 100)}%)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isSearching && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                🧠
              </div>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="border-t border-white/5 bg-[rgba(5,5,15,0.6)] p-4">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto items-end">
            <div className="flex-1 glass-card rounded-2xl overflow-hidden flex items-end">
              <textarea
                ref={textareaRef}
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents... (Enter to send)"
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm px-4 py-3 outline-none resize-none min-h-[44px] max-h-[160px]"
                disabled={isSearching}
                rows={1}
              />
            </div>
            <button
              type="submit"
              id="send-message-btn"
              disabled={!input.trim() || isSearching}
              className="btn-brand rounded-xl w-11 h-11 p-0 flex-shrink-0"
              title="Send (Enter)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-slate-700 mt-2">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
      )}
    </div>
  );
}
