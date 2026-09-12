# relay-chat-widget

A framework-agnostic, floating chat widget that lets your customers embed
your RAG chatbot on their own website — a chat icon in the corner that
expands into a chat panel, wired up to your platform's public widget API.

Get your **API key** and configure appearance (icon position, color, welcome
message) from the chatbot's **"Embed & API"** tab in the dashboard first.

## Option A — Plain `<script>` tag (any website)

Works on WordPress, Wix, Shopify, static HTML — no build step, no npm.

1. Build this package (`npm run build`) and host `dist/index.global.js`
   somewhere public — e.g. copy it to your Next.js app's `public/widget.js`
   so it's served at `https://your-app.com/widget.js`, or publish this
   package to npm and use a CDN like `https://unpkg.com/relay-chat-widget`.
2. Add this snippet before `</body>` on the customer's site:

```html
<script src="https://your-app.com/widget.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    ChatbotWidget.init({
      apiKey: 'pk_live_xxxxxxxxxxxxxxxxxxxx',
    });
  });
</script>
```

## Option B — npm / bundler (React, Vue, Next.js, etc.)

```bash
npm install relay-chat-widget
```

```ts
import { init } from 'relay-chat-widget';

init({
  apiKey: 'pk_live_xxxxxxxxxxxxxxxxxxxx',
});
```

Call this once, e.g. in your root layout/App component's mount effect.

## Config options

| Option | Required | Description |
|---|---|---|
| `apiKey` | ✅ | Per-chatbot public key from the dashboard's "Embed & API" tab. Identifies which chatbot to use. |
| `baseUrl` | | Override the platform URL baked into `src/config.ts` (`DEFAULT_BASE_URL`). Customers normally omit this. |
| `position` | | `'bottom-right' \| 'bottom-left'`. Overrides the dashboard setting for this specific embed. |
| `primaryColor` | | Hex color, e.g. `'#4f46e5'`. Overrides the dashboard setting. |
| `welcomeMessage` | | Overrides the dashboard setting. |
| `chatbotName` | | Overrides the chatbot name shown in the widget header. |
| `topK` | | Number of source chunks to retrieve per answer. Default `5`. |

By default (no overrides passed), the widget fetches **position, color,
welcome message, and name from the dashboard** on load — so you can tweak
the widget's appearance for a customer without touching their embedded
code at all. Any option passed to `init()` takes priority over the
dashboard's value.

## Security notes

- This API key is meant to run in client-side JS — it is intentionally a
  "public" key, not a server secret. It can only be used to ask the chatbot
  questions (no document upload/management access).
- Restrict which domains can use a key via **Allowed Origins** in the
  dashboard (defaults to `*`, i.e. any site) once you know the customer's
  domain, for defense in depth.
- Rotating a key from the dashboard immediately invalidates the old one —
  update the embed snippet everywhere it's used afterward.

## Platform URL (`src/config.ts`)

Set your production URL once in `src/config.ts` before publishing:

```ts
export const DEFAULT_BASE_URL = 'https://your-app.com';
```

Customers only pass `apiKey` — the widget calls `${DEFAULT_BASE_URL}/api/public/*`.

## Development

```bash
npm install
npm run build   # outputs dist/index.cjs (cjs), dist/index.js (esm), dist/index.global.js (iife)
npm run dev      # watch mode
```

If this repo's `nextjs-app` lives alongside this package (the default layout),
`npm run build:copy-local` builds and also copies `dist/index.global.js` to
`../nextjs-app/public/widget.js`, so `https://your-app.com/widget.js` is
served automatically in local dev/self-hosted deployments — no separate
publish/CDN step needed.
