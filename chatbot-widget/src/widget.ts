import { fetchWidgetConfig, sendChatMessage } from './api';
import { DEFAULT_BASE_URL } from './config';
import type { ChatMessage, WidgetInitConfig, WidgetPosition } from './types';

const DEFAULTS = {
  position: 'bottom-right' as WidgetPosition,
  primaryColor: '#4f46e5',
  welcomeMessage: 'Hi! How can I help you today?',
  chatbotName: 'Assistant',
};

let uid = 0;
function nextId(): string {
  uid += 1;
  return `msg-${Date.now()}-${uid}`;
}

type ResolvedWidgetConfig = WidgetInitConfig & { baseUrl: string };

export class ChatWidget {
  private config: ResolvedWidgetConfig;
  private resolved = { ...DEFAULTS };
  private messages: ChatMessage[] = [];
  private isOpen = false;
  private isSending = false;

  private host!: HTMLDivElement;
  private shadow!: ShadowRoot;
  private panelEl!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtnEl!: HTMLButtonElement;
  private toggleBtnEl!: HTMLButtonElement;

  // Resolves once the dashboard-managed config (position/color/welcome
  // message/name) has been fetched and applied. `open()` awaits this before
  // rendering the first welcome message so a fast click right after page
  // load can't show stale default text instead of the real configured one.
  private configReady: Promise<void> = Promise.resolve();

  constructor(config: WidgetInitConfig) {
    if (!config?.apiKey) throw new Error('[ChatbotWidget] "apiKey" is required.');

    this.config = {
      ...config,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    };
    // Local overrides passed to init() win immediately; remote (dashboard)
    // config fills in anything not explicitly overridden, once it loads.
    this.resolved = {
      position: config.position ?? DEFAULTS.position,
      primaryColor: config.primaryColor ?? DEFAULTS.primaryColor,
      welcomeMessage: config.welcomeMessage ?? DEFAULTS.welcomeMessage,
      chatbotName: config.chatbotName ?? DEFAULTS.chatbotName,
    };
  }

  async mount(): Promise<void> {
    this.buildDom();
    document.body.appendChild(this.host);
    this.applyTheme();

    // Fetch dashboard-managed config in the background; apply anything the
    // caller didn't explicitly override once it resolves.
    this.configReady = this.loadRemoteConfig();
    await this.configReady;
  }

  private async loadRemoteConfig(): Promise<void> {
    const remote = await fetchWidgetConfig(this.config.baseUrl, this.config.apiKey);
    if (remote) {
      this.resolved = {
        position: this.config.position ?? remote.position ?? this.resolved.position,
        primaryColor: this.config.primaryColor ?? remote.primaryColor ?? this.resolved.primaryColor,
        welcomeMessage: this.config.welcomeMessage ?? remote.welcomeMessage ?? this.resolved.welcomeMessage,
        chatbotName: this.config.chatbotName ?? remote.name ?? this.resolved.chatbotName,
      };
      this.applyTheme();
    }
  }

  destroy(): void {
    this.host?.remove();
  }

  // ── DOM construction ────────────────────────────────────────────────

  private buildDom(): void {
    this.host = document.createElement('div');
    this.host.setAttribute('data-chatbot-widget-host', '');
    // Shadow DOM isolates widget styles from the host page and vice versa.
    this.shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'cbw-root';
    this.shadow.appendChild(root);

    // Toggle button (floating icon)
    this.toggleBtnEl = document.createElement('button');
    this.toggleBtnEl.className = 'cbw-toggle';
    this.toggleBtnEl.setAttribute('aria-label', 'Open chat');
    this.toggleBtnEl.innerHTML = ICON_CHAT;
    this.toggleBtnEl.addEventListener('click', () => this.toggle());
    root.appendChild(this.toggleBtnEl);

    // Panel
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'cbw-panel cbw-hidden';
    root.appendChild(this.panelEl);

    const header = document.createElement('div');
    header.className = 'cbw-header';
    const title = document.createElement('span');
    title.className = 'cbw-header-title';
    title.textContent = this.resolved.chatbotName;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cbw-close';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(title);
    header.appendChild(closeBtn);
    this.panelEl.appendChild(header);

    this.messagesEl = document.createElement('div');
    this.messagesEl.className = 'cbw-messages';
    this.panelEl.appendChild(this.messagesEl);

    const inputBar = document.createElement('div');
    inputBar.className = 'cbw-input-bar';

    this.inputEl = document.createElement('textarea');
    this.inputEl.className = 'cbw-input';
    this.inputEl.placeholder = 'Type your message…';
    this.inputEl.rows = 1;
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 100)}px`;
    });

    this.sendBtnEl = document.createElement('button');
    this.sendBtnEl.className = 'cbw-send';
    this.sendBtnEl.setAttribute('aria-label', 'Send message');
    this.sendBtnEl.innerHTML = ICON_SEND;
    this.sendBtnEl.addEventListener('click', () => this.handleSend());

    inputBar.appendChild(this.inputEl);
    inputBar.appendChild(this.sendBtnEl);
    this.panelEl.appendChild(inputBar);
  }

  private applyTheme(): void {
    this.host.style.setProperty('--cbw-primary', this.resolved.primaryColor);
    const root = this.shadow.querySelector('.cbw-root');
    if (root) {
      root.classList.toggle('cbw-left', this.resolved.position === 'bottom-left');
      root.classList.toggle('cbw-right', this.resolved.position !== 'bottom-left');
    }
    const title = this.shadow.querySelector('.cbw-header-title');
    if (title) title.textContent = this.resolved.chatbotName;
  }

  // ── Behavior ─────────────────────────────────────────────────────────

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      void this.open();
    }
  }

  private async open(): Promise<void> {
    this.isOpen = true;
    this.panelEl.classList.remove('cbw-hidden');
    this.toggleBtnEl.innerHTML = ICON_CLOSE;
    if (this.messages.length === 0) {
      // Wait for the real dashboard-configured welcome message rather than
      // risking showing the local/default placeholder on a fast first click.
      await this.configReady;
      this.addMessage({ id: nextId(), role: 'bot', content: this.resolved.welcomeMessage });
    }
    this.inputEl.focus();
  }

  private close(): void {
    this.isOpen = false;
    this.panelEl.classList.add('cbw-hidden');
    this.toggleBtnEl.innerHTML = ICON_CHAT;
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    this.renderMessage(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private renderMessage(msg: ChatMessage): void {
    const row = document.createElement('div');
    row.className = `cbw-row ${msg.role === 'user' ? 'cbw-row-user' : 'cbw-row-bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'cbw-bubble';
    // Rendered as plain text (not innerHTML) so nothing in the LLM's answer
    // or a user's own message can inject markup into the host page.
    bubble.textContent = msg.content;
    row.appendChild(bubble);

    if (msg.sources && msg.sources.length > 0) {
      const sourcesEl = document.createElement('div');
      sourcesEl.className = 'cbw-sources';
      for (const src of msg.sources) {
        const chip = document.createElement('span');
        chip.className = 'cbw-source-chip';
        chip.textContent = `📄 ${src.document_name}`;
        sourcesEl.appendChild(chip);
      }
      bubble.appendChild(sourcesEl);
    }

    this.messagesEl.appendChild(row);
  }

  private setTyping(show: boolean): void {
    let typingEl = this.shadow.querySelector('.cbw-typing') as HTMLDivElement | null;
    if (show) {
      if (!typingEl) {
        typingEl = document.createElement('div');
        typingEl.className = 'cbw-row cbw-row-bot cbw-typing';
        typingEl.innerHTML = '<div class="cbw-bubble cbw-dots"><span></span><span></span><span></span></div>';
        this.messagesEl.appendChild(typingEl);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
    } else {
      typingEl?.remove();
    }
  }

  private async handleSend(): Promise<void> {
    const query = this.inputEl.value.trim();
    if (!query || this.isSending) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.addMessage({ id: nextId(), role: 'user', content: query });

    this.isSending = true;
    this.sendBtnEl.disabled = true;
    this.setTyping(true);

    try {
      const { answer, sources } = await sendChatMessage(
        this.config.baseUrl,
        this.config.apiKey,
        query,
        this.config.topK ?? 5
      );
      this.setTyping(false);
      this.addMessage({ id: nextId(), role: 'bot', content: answer, sources });
    } catch (err) {
      this.setTyping(false);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      this.addMessage({ id: nextId(), role: 'bot', content: `⚠️ ${message}` });
    } finally {
      this.isSending = false;
      this.sendBtnEl.disabled = false;
    }
  }
}

const ICON_CHAT =
  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9-1.5 0-2.92-.37-4.16-1.02L3 21l1.05-3.68A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"/></svg>';
const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
const ICON_SEND =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>';

const STYLES = `
  :host { all: initial; }
  .cbw-root {
    position: fixed;
    bottom: 20px;
    z-index: 2147483000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .cbw-root.cbw-right { right: 20px; }
  .cbw-root.cbw-left { left: 20px; }

  .cbw-toggle {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    transition: transform 0.15s ease;
  }
  .cbw-toggle:hover { transform: scale(1.06); }

  .cbw-panel {
    position: absolute;
    bottom: 72px;
    width: 340px;
    max-height: min(70vh, 520px);
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.06);
  }
  .cbw-root.cbw-right .cbw-panel { right: 0; }
  .cbw-root.cbw-left .cbw-panel { left: 0; }
  .cbw-panel.cbw-hidden { display: none; }

  .cbw-header {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
  }
  .cbw-close {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    opacity: 0.85;
  }
  .cbw-close:hover { opacity: 1; }

  .cbw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8f9fb;
  }

  .cbw-row { display: flex; }
  .cbw-row-user { justify-content: flex-end; }
  .cbw-row-bot { justify-content: flex-start; }

  .cbw-bubble {
    max-width: 82%;
    padding: 9px 13px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .cbw-row-user .cbw-bubble {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .cbw-row-bot .cbw-bubble {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid rgba(0,0,0,0.06);
    border-bottom-left-radius: 4px;
  }

  .cbw-sources { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
  .cbw-source-chip {
    font-size: 10.5px;
    background: rgba(79,70,229,0.08);
    color: var(--cbw-primary, #4f46e5);
    border: 1px solid rgba(79,70,229,0.18);
    border-radius: 99px;
    padding: 2px 8px;
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cbw-dots { display: flex; gap: 4px; align-items: center; }
  .cbw-dots span {
    width: 6px; height: 6px; border-radius: 50%;
    background: #9ca3af;
    animation: cbw-blink 1.2s ease-in-out infinite;
  }
  .cbw-dots span:nth-child(2) { animation-delay: 0.2s; }
  .cbw-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cbw-blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

  .cbw-input-bar {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid rgba(0,0,0,0.06);
    background: #fff;
  }
  .cbw-input {
    flex: 1;
    resize: none;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 13.5px;
    font-family: inherit;
    max-height: 100px;
    outline: none;
  }
  .cbw-input:focus { border-color: var(--cbw-primary, #4f46e5); }

  .cbw-send {
    background: var(--cbw-primary, #4f46e5);
    color: #fff;
    border: none;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .cbw-send:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 480px) {
    .cbw-panel { width: calc(100vw - 32px); }
  }
`;
