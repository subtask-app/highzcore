'use client';

// When the app is opened inside Telegram, this component:
//   1. Reads `window.Telegram.WebApp.initData` (signed payload from Telegram)
//   2. Checks whether a Supabase session already exists
//   3. If NOT, POSTs initData to /api/telegram/link to mint one, then routes
//      to the returned dashboard
//
// The key correctness rule: the decision to (re)link is driven by "is there
// a live session?", NOT by a cached initData hash. The old hash-cache version
// would skip re-linking after the Supabase cookie expired, leaving returning
// mobile users stranded on /login — where tapping "Sign in with Google"
// fails with Google's `disallowed_useragent` inside Telegram's webview.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Module-level guard so client-side route changes within a single page load
// don't re-trigger the link. Resets naturally on a full reload.
let inFlightOrDone = false;

export default function TelegramAutoLink() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return; // not inside Telegram
    if (inFlightOrDone) return;
    inFlightOrDone = true;

    // Tell Telegram we're ready and want full viewport.
    try { tg.ready(); tg.expand(); } catch {}

    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return; // already authenticated — nothing to do

        // No session → mint one from the signed Telegram initData.
        const res = await fetch('/api/telegram/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.warn('Telegram link failed:', data);
          inFlightOrDone = false; // allow a retry on next mount
          return;
        }
        if (data.redirect) router.replace(data.redirect);
      } catch (e) {
        console.warn('Telegram link error:', e);
        inFlightOrDone = false; // allow a retry on next mount
      }
    })();
  }, [router]);

  return null;
}
