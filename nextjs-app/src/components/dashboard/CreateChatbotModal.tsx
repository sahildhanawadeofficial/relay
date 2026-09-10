'use client';

import { useState, useEffect } from 'react';

export default function CreateChatbotModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (bot: any) => void;
}) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create chatbot');
      }

      onCreate(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card-solid w-full max-w-md overflow-hidden animate-fade-in-up shadow-2xl">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">New Chatbot</h2>
            <p className="text-sm text-slate-400 mt-0.5">A UUID will be generated automatically</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="alert-error mb-5 animate-fade-in">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="chatbot-name" className="block text-sm font-medium text-slate-300 mb-2">
              Chatbot Name
            </label>
            <input
              id="chatbot-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., HR Knowledge Base, Customer Support..."
              required
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">
              {name.length}/100 characters
            </p>
          </div>

          {/* PREVIEW */}
          <div className="glass-card p-3 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{name || 'Chatbot Name'}</p>
              <p className="text-xs text-slate-500 font-mono">UUID auto-generated on create</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="create-chatbot-submit-btn"
              disabled={isSubmitting || !name.trim()}
              className="btn-brand flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Chatbot'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
