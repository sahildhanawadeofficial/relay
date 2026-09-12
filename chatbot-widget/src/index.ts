import { ChatWidget } from './widget';
import type { WidgetInitConfig } from './types';

export type { WidgetInitConfig, WidgetPosition, ChatMessage, ChatSource, RemoteWidgetConfig } from './types';
export { DEFAULT_BASE_URL } from './config';

let activeWidget: ChatWidget | null = null;

/**
 * Mounts the chat widget onto the current page.
 *
 * ```ts
 * import { init } from 'relay-chat-widget';
 *
 * init({
 *   apiKey: 'pk_live_...',      // from the dashboard's "Embed & API" tab
 * });
 * ```
 *
 * Calling `init()` again replaces any already-mounted widget (safe against
 * accidental double-init, e.g. on a single-page app route change).
 */
export function init(config: WidgetInitConfig): ChatWidget {
  activeWidget?.destroy();

  const widget = new ChatWidget(config);
  activeWidget = widget;

  // mount() is async (it fetches dashboard config in the background), but
  // init() stays synchronous so `<script>` tag usage doesn't need to await
  // anything — the button just appears a moment after the script runs.
  void widget.mount();

  return widget;
}

/** Unmounts the currently active widget, if any. */
export function destroy(): void {
  activeWidget?.destroy();
  activeWidget = null;
}
