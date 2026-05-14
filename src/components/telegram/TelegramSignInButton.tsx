'use client';

// "Continue with Telegram" — the sign-in path for users inside the Telegram
// Mini App. They're already identified by Telegram's signed initData, so
// there's no need (and no way — Google blocks OAuth in Telegram's mobile
// webview) to do Google sign-in here.
//
// Renders NOTHING outside Telegram, so login/signup pages can drop it in
// unconditionally next to the Google button — only one will ever show.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { getTg } from '@/lib/telegram/webapp';

interface Props {
  /** 'client' | 'worker' — role hint for first-time signups. */
  role: 'client' | 'worker';
}

export default function TelegramSignInButton({ role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // SSR-safe: getTg() returns null on the server and outside Telegram.
  const tg = typeof window !== 'undefined' ? getTg() : null;
  if (!tg || !tg.initData) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? 'Sign-in failed');
      router.replace(data.redirect ?? `/dashboard/${role === 'client' ? 'client' : 'worker'}`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in with Telegram');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            <span>Continue with Telegram</span>
          </>
        )}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
      )}
      <p className="mt-3 text-xs text-white/40 text-center">
        You're inside Telegram — no password, no Google screen. One tap.
      </p>
    </div>
  );
}
