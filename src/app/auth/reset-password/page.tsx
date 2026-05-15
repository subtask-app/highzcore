'use client';

// /auth/reset-password — landing page for the link Supabase sends. The user
// arrives with an active session (the OTP in the URL hash is consumed by
// the SDK on mount) and submits a new password.

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    // The Supabase SDK auto-consumes the recovery hash on load. Confirm
    // we have a session before showing the form.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push('/post-login');
      router.refresh();
    });
  };

  return (
    <AuthShell title="Set a new password" description="Pick something at least 8 characters.">
      {!ready ? (
        <p className="text-sm text-fg-muted">Verifying your reset link…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            type={showPw ? 'text' : 'password'}
            label="New password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={pending}
            rightSlot={
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-fg-subtle hover:text-fg"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            type={showPw ? 'text' : 'password'}
            label="Confirm password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={pending}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Save new password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
