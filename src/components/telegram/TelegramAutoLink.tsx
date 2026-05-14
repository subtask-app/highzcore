'use client';

// When the app is opened inside Telegram, this component:
//   1. Reads `window.Telegram.WebApp.initData` (signed payload from Telegram)
//   2. POSTs it to /api/telegram/link
//   3. On success, navigates to the returned dashboard route
//
// Cached on `initData.hash` so it only fires once per session, not on every
// route change.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// window.Telegram typing lives in @/lib/telegram/webapp (single source of truth).

const SEEN_KEY = 'hzcr_tg_linked_hash';

export default function TelegramAutoLink() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;            // not inside Telegram

    // Tell Telegram we're ready and want full viewport.
    try { tg.ready(); tg.expand(); } catch {}

    // Pull the hash from initData so we don't re-link on every render.
    const params = new URLSearchParams(tg.initData);
    const hash = params.get('hash');
    if (!hash) return;
    try {
      if (window.localStorage.getItem(SEEN_KEY) === hash) return;
    } catch {}

    (async () => {
      try {
        const res = await fetch('/api/telegram/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.warn('Telegram link failed:', data);
          return;
        }
        try { window.localStorage.setItem(SEEN_KEY, hash); } catch {}
        if (data.redirect) router.replace(data.redirect);
      } catch (e) {
        console.warn('Telegram link error:', e);
      }
    })();
  }, [router]);

  return null;
}
