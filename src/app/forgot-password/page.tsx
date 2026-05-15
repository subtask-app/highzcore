'use client';

// /forgot-password — request a password reset email via Supabase. The link
// in the email goes to /auth/reset-password (handled by the OAuth callback
// route + a small reset form, both shipped as part of this milestone).

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    });
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Type your email and we'll send you a link to set a new password."
      backHref="/login"
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="text-brand font-semibold">Log in</Link>
        </>
      }
    >
      {sent ? (
        <p className="text-sm text-fg-muted leading-relaxed">
          If an account exists for <strong className="text-fg">{email}</strong>, a reset link is on
          its way. Check your inbox in the next minute.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            disabled={pending}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
