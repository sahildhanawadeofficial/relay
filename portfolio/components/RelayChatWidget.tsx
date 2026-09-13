'use client';

import { useEffect } from 'react';
import { destroy, init } from 'relay-chat-widget';

export default function RelayChatWidget() {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_RELAY_API_KEY;
    if (!apiKey) {
      console.warn('[RelayChatWidget] NEXT_PUBLIC_RELAY_API_KEY is not set.');
      return;
    }

    init({ apiKey });

    return () => {
      destroy();
    };
  }, []);

  return null;
}
