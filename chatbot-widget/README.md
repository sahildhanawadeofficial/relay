# relay-chat-widget

Add a floating chat button to your website. Visitors click it, ask questions, and get answers from **your** Relay chatbot (trained on your documents).

---

## Before you start (get your API key)

You need a free Relay account and an API key. This takes about 2 minutes.

1. Open **[https://relayy-dun.vercel.app](https://relayy-dun.vercel.app)** and sign in.
2. Create a chatbot (give it a name).
3. Upload your documents (PDF, DOCX, or TXT) so the bot can answer from them.
4. Open your chatbot → **Embed & API** tab.
5. Copy your **API key** — it looks like `pk_live_xxxxxxxx...`

Keep that key handy. You will paste it into your code below.

> You do **not** need to set a server URL. This package already points to Relay at `https://relayy-dun.vercel.app`. You only pass `apiKey`.

---

## Option A — React / Next.js / npm (recommended)

Best if you use **React**, **Next.js**, **Vite**, or any project with `npm`.

### Step 1 — Install

In your project folder:

```bash
npm install relay-chat-widget
```

### Step 2 — Add the widget (React)

Create a small component (e.g. `RelayChat.tsx`) and paste your API key:

```tsx
'use client'; // Next.js App Router only — omit this line in plain React (Vite, CRA)

import { useEffect } from 'react';
import { init, destroy } from 'relay-chat-widget';

export default function RelayChat() {
  useEffect(() => {
    init({
      apiKey: 'pk_live_PASTE_YOUR_KEY_HERE',
    });

    return () => destroy();
  }, []);

  return null; // The widget draws itself on the page — no UI to render here
}
```

### Step 3 — Mount it once in your app

**Next.js (App Router)** — add to `app/layout.tsx`:

```tsx
import RelayChat from '@/components/RelayChat';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RelayChat />
      </body>
    </html>
  );
}
```

**Plain React (Vite, etc.)** — add to `App.tsx`:

```tsx
import RelayChat from './RelayChat';

function App() {
  return (
    <>
      {/* your existing app */}
      <RelayChat />
    </>
  );
}
```

### Step 4 — Run your app

```bash
npm run dev
```

You should see a chat icon in the bottom-right corner. Click it and ask a question about your uploaded documents.

---

## Option B — `<script>` tag (no npm, no React)

Use this on **WordPress**, **Wix**, **Shopify**, or plain HTML pages where you cannot use npm.

Paste this **before** the closing `</body>` tag. Replace the API key with yours from Relay:

```html
<script src="https://unpkg.com/relay-chat-widget/dist/index.global.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    ChatbotWidget.init({
      apiKey: 'pk_live_PASTE_YOUR_KEY_HERE',
    });
  });
</script>
```

Save, refresh the page, and the chat icon should appear.

---

## Customize look & behavior (optional)

You can change colors and text in two ways:

1. **Relay dashboard** (easiest) — **Embed & API** tab: position, color, welcome message. No code change needed.
2. **In code** — pass extra options to `init()`:

```ts
init({
  apiKey: 'pk_live_...',
  position: 'bottom-left',       // or 'bottom-right'
  primaryColor: '#4f46e5',
  welcomeMessage: 'Hi! How can I help?',
  chatbotName: 'Support',
});
```

Anything you pass in code **overrides** the dashboard for that embed.

| Option | Required? | What it does |
|--------|-----------|--------------|
| `apiKey` | **Yes** | Your key from [Relay](https://relayy-dun.vercel.app) → Embed & API |
| `position` | No | `'bottom-right'` or `'bottom-left'` |
| `primaryColor` | No | Button/header color, e.g. `'#4f46e5'` |
| `welcomeMessage` | No | First message the bot shows |
| `chatbotName` | No | Title in the chat header |
| `topK` | No | How many document chunks to search (default `5`) |
| `baseUrl` | No | Only if you self-host Relay — leave unset for relayy-dun.vercel.app |

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| No chat icon | Check the API key is correct and copied fully (`pk_live_...`) |
| “Origin not allowed” | In Relay → **Embed & API** → set **Allowed Origins** to `*` or your site URL |
| Widget works locally but not on live site | Add your production URL to **Allowed Origins** in Relay |
| Chat returns errors | Make sure you uploaded documents to that chatbot in Relay |

---

## Security (short version)

- The API key is **public** (it runs in the browser). It can only **chat** — not upload or delete documents.
- Lock down **Allowed Origins** in Relay once you know your website URL.
- If you **regenerate** the key in Relay, update it everywhere you embedded the widget.

---

## For package maintainers

```bash
npm install
npm run build
npm run dev   # watch mode
```

Production Relay URL is set in `src/config.ts` (`DEFAULT_BASE_URL`).
