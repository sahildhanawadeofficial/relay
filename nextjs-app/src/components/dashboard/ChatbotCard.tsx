'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ChatbotData {
  uuid: string;
  name: string;
  createdAt: string;
}

interface ChatbotCardProps {
  chatbot: ChatbotData;
  onDelete: (uuid: string) => void;
}

export default function ChatbotCard({ chatbot, onDelete }: ChatbotCardProps) {
  const date = new Date(chatbot.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const shortId = chatbot.uuid.split('-')[0];
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(chatbot.uuid);
      }
    } catch {
      setIsDeleting(false);
    }
  };

  // Pick a gradient accent based on first char of name
  const gradients = [
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-violet-600',
  ];
  const gradient = gradients[chatbot.name.charCodeAt(0) % gradients.length];

  return (
    <div className="glass-card p-6 flex flex-col group animate-fade-in-up relative overflow-hidden">
      {/* Gradient accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

      {/* ICON + NAME */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
          {chatbot.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-base leading-tight truncate">{chatbot.name}</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">#{shortId}</p>
        </div>
      </div>

      {/* META */}
      <div className="flex items-center gap-2 mb-5">
        <span className="badge badge-brand">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          RAG Enabled
        </span>
        <span className="text-xs text-slate-500">{date}</span>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
        <Link
          href={`/chatbots/${chatbot.uuid}`}
          id={`open-chatbot-${shortId}`}
          className="btn-brand flex-1 text-center text-sm py-2"
        >
          Open Chatbot
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          id={`delete-chatbot-${shortId}`}
          title={confirmDelete ? 'Click again to confirm' : 'Delete chatbot'}
          className={`btn-danger flex-shrink-0 py-2 px-3 ${confirmDelete ? 'bg-red-500/20 border-red-400/50' : ''}`}
        >
          {isDeleting ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : confirmDelete ? (
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      {confirmDelete && (
        <p className="text-xs text-red-400 text-center mt-2 animate-fade-in">
          Click again to confirm deletion
        </p>
      )}
    </div>
  );
}
