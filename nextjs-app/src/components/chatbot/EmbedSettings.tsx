'use client';

import { useEffect, useState } from 'react';

export interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  welcomeMessage: string;
}

export interface EmbedChatbotData {
  uuid: string;
  name: string;
  apiKey: string | null;
  allowedOrigins: string[];
  widgetConfig: WidgetConfig;
}

type SaveState = { type: 'idle' } | { type: 'saving' } | { type: 'saved' } | { type: 'error'; message: string };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="btn-ghost text-xs px-3 py-1.5"
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  );
}

export default function EmbedSettings({ chatbot }: { chatbot: EmbedChatbotData }) {
  const [apiKey, setApiKey] = useState(chatbot.apiKey);
  const [rotating, setRotating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const [allowedOriginsText, setAllowedOriginsText] = useState((chatbot.allowedOrigins ?? ['*']).join(', '));
  const [position, setPosition] = useState<WidgetConfig['position']>(chatbot.widgetConfig.position);
  const [primaryColor, setPrimaryColor] = useState(chatbot.widgetConfig.primaryColor);
  const [welcomeMessage, setWelcomeMessage] = useState(chatbot.widgetConfig.welcomeMessage);
  const [saveState, setSaveState] = useState<SaveState>({ type: 'idle' });

  // Computed post-mount (not during render) so the server-rendered markup
  // and the initial client render both start from '' — reading
  // window.location.origin directly during render would mismatch between
  // the server ('' — no window) and client (real origin) and trigger a
  // React hydration warning on this SSR'd client component.
  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const maskedKey = apiKey ? `${apiKey.slice(0, 11)}${'•'.repeat(20)}${apiKey.slice(-4)}` : null;

  const handleGenerateOrRotate = async () => {
    setRotating(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.uuid}/api-key`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API key');
      setApiKey(data.apiKey);
      setRevealed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRotating(false);
    }
  };

  const handleSave = async () => {
    setSaveState({ type: 'saving' });
    try {
      const allowedOrigins = allowedOriginsText
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const res = await fetch(`/api/chatbots/${chatbot.uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : ['*'],
          widgetConfig: { position, primaryColor, welcomeMessage },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSaveState({ type: 'saved' });
      setTimeout(() => setSaveState({ type: 'idle' }), 2000);
    } catch (err: any) {
      setSaveState({ type: 'error', message: err.message || 'Failed to save settings' });
    }
  };

  const scriptSnippet = `<script src="${baseUrl}/widget.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    ChatbotWidget.init({
      apiKey: '${apiKey ?? 'YOUR_API_KEY'}',
      baseUrl: '${baseUrl}'
    });
  });
</script>`;

  const npmSnippet = `npm install chatbot-embed-widget

import { init } from 'chatbot-embed-widget';

init({
  apiKey: '${apiKey ?? 'YOUR_API_KEY'}',
  baseUrl: '${baseUrl}',
});`;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 max-w-3xl mx-auto w-full space-y-8">
      {/* API KEY */}
      <section className="glass-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Public API Key</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Used by the embeddable widget to authenticate requests from your customer&apos;s website. This key is
            meant to run in client-side JS &mdash; access is scoped to chat only and restricted by allowed origins
            below.
          </p>
        </div>

        {apiKey ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="input-field font-mono text-xs flex-1 min-w-[240px] select-all">
              {revealed ? apiKey : maskedKey}
            </code>
            <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={() => setRevealed((r) => !r)}>
              {revealed ? '🙈 Hide' : '👁️ Reveal'}
            </button>
            <CopyButton text={apiKey} />
            <button
              type="button"
              onClick={handleGenerateOrRotate}
              disabled={rotating}
              className="btn-danger text-xs"
            >
              {rotating ? 'Rotating…' : '🔄 Regenerate'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleGenerateOrRotate} disabled={rotating} className="btn-brand text-sm">
            {rotating ? 'Generating…' : 'Generate API Key'}
          </button>
        )}
        {apiKey && (
          <p className="text-xs text-slate-600">
            ⚠️ Regenerating invalidates the old key immediately &mdash; update it everywhere it&apos;s embedded.
          </p>
        )}
      </section>

      {/* ALLOWED ORIGINS */}
      <section className="glass-card p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Allowed Origins</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comma-separated list of websites allowed to use this key (e.g.{' '}
            <code className="text-slate-400">https://example.com</code>). Defaults to{' '}
            <code className="text-slate-400">*</code> (any website) so the widget works immediately &mdash; lock
            this down once you know your customer&apos;s domain.
          </p>
        </div>
        <input
          type="text"
          value={allowedOriginsText}
          onChange={(e) => setAllowedOriginsText(e.target.value)}
          placeholder="*"
          className="input-field text-sm font-mono"
        />
      </section>

      {/* WIDGET APPEARANCE */}
      <section className="glass-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Widget Appearance &amp; Behavior</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configured here on the server &mdash; the embedded widget fetches these automatically, no code changes
            needed on the customer&apos;s site.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Icon Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as WidgetConfig['position'])}
              className="input-field text-sm"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="input-field text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Welcome Message</label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={2}
            maxLength={500}
            className="input-field text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saveState.type === 'saving'} className="btn-brand text-sm">
            {saveState.type === 'saving' ? 'Saving…' : 'Save Settings'}
          </button>
          {saveState.type === 'saved' && <span className="text-xs text-green-400">✅ Saved</span>}
          {saveState.type === 'error' && <span className="text-xs text-red-400">❌ {saveState.message}</span>}
        </div>
      </section>

      {/* EMBED SNIPPETS */}
      <section className="glass-card p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Embed on your website</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pick whichever fits your customer&apos;s site &mdash; a plain script tag works anywhere (WordPress, Wix,
            static HTML); the npm package suits React/Vue/bundler-based sites.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Script Tag</p>
            <CopyButton text={scriptSnippet} />
          </div>
          <pre className="input-field text-xs font-mono whitespace-pre-wrap overflow-x-auto">{scriptSnippet}</pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">npm Package</p>
            <CopyButton text={npmSnippet} />
          </div>
          <pre className="input-field text-xs font-mono whitespace-pre-wrap overflow-x-auto">{npmSnippet}</pre>
        </div>
      </section>
    </div>
  );
}
