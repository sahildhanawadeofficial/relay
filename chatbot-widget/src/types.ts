export type WidgetPosition = 'bottom-right' | 'bottom-left';

export interface WidgetInitConfig {
  /** Required. The per-chatbot public API key from the dashboard's "Embed & API" tab. */
  apiKey: string;
  /**
   * Base URL of the chatbot platform (the Next.js app), e.g. "https://your-app.com".
   * Required — there is no default, since this widget can point at any
   * self-hosted deployment of the platform.
   */
  baseUrl: string;
  /** Override the dashboard-configured icon position ('bottom-right' | 'bottom-left'). */
  position?: WidgetPosition;
  /** Override the dashboard-configured accent color (hex, e.g. "#4f46e5"). */
  primaryColor?: string;
  /** Override the dashboard-configured welcome message. */
  welcomeMessage?: string;
  /** Override the chatbot display name shown in the widget header. */
  chatbotName?: string;
  /** How many source chunks to request per answer. Defaults to 5. */
  topK?: number;
}

export interface RemoteWidgetConfig {
  name: string;
  position: WidgetPosition;
  primaryColor: string;
  welcomeMessage: string;
}

export interface ChatSource {
  document_name: string;
  chunk_id: number;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: ChatSource[];
}
