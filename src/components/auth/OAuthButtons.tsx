'use client';

// "Continue with Google" / "Continue with Telegram" buttons that share the
// surface of the auth pages. Inside the Telegram mini-app we surface the
// Telegram button; on web we surface Google.

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { isInTelegram } from '@/lib/telegram/webapp';

interface Props {
  role?: 'creator' | 'worker';
}

export function OAuthButtons({ role }: Props) {
  const [inTelegram, setInTelegram] = useState(false);
  useEffect(() => {
    setInTelegram(isInTelegram());
  }, []);

  if (inTelegram) {
    return <TelegramOAuthButton role={role} />;
  }
  return <GoogleOAuthButton role={role} />;
}

function GoogleOAuthButton({ role }: { role?: 'creator' | 'worker' }) {
  const [pending, startTransition] = useTransition();
  const click = () => {
    startTransition(async () => {
      const supabase = createClient();
      const next = role ? `/onboarding/${role}` : '/post-login';
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
    });
  };
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      fullWidth
      onClick={click}
      loading={pending}
      leftIcon={<GoogleIcon />}
    >
      Continue with Google
    </Button>
  );
}

function TelegramOAuthButton({ role }: { role?: 'creator' | 'worker' }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const click = () => {
    startTransition(async () => {
      setError(null);
      const initData = window?.Telegram?.WebApp?.initData;
      if (!initData) {
        setError('Telegram session not available. Open the app from the bot menu.');
        return;
      }
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, role: role ?? 'worker' }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; redirect?: string; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? 'Telegram sign-in failed. Try again.');
        return;
      }
      window.location.href = json.redirect ?? '/post-login';
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={click}
        loading={pending}
        leftIcon={<TelegramIcon />}
      >
        Continue with Telegram
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.47 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#229ED9" />
      <path
        fill="#fff"
        d="m17.5 7.2-2.2 10.4c-.16.74-.6.92-1.22.57l-3.38-2.49-1.63 1.57c-.18.18-.33.33-.68.33l.24-3.43 6.25-5.65c.27-.24-.06-.38-.42-.14L7.65 12.4l-3.33-1.04c-.72-.23-.74-.72.15-1.07l13-5.01c.6-.22 1.13.14.93 1.09Z"
      />
    </svg>
  );
}
