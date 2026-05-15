'use client';

// Email/password signup + login form, parameterised by mode.
// Used by both /signup/creator + /signup/worker (mode='signup') and /login
// (mode='login'). Centralises validation, error messages, and the call into
// Supabase Auth.
//
// useSearchParams is read inside <Inner> wrapped in Suspense so the parent
// page can statically prerender — Next 16 requires the boundary around any
// component that reads search params.

import { Suspense, useState, useTransition, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export type Mode = 'signup' | 'login';

interface Props {
  mode: Mode;
  /** Role being signed up for (sets is_creator/is_worker post-confirm). */
  role?: 'creator' | 'worker';
}

export function EmailPasswordForm(props: Props) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Inner {...props} />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 rounded-md bg-surface-active" />
      <div className="h-12 rounded-md bg-surface-active" />
      <div className="h-14 rounded-md bg-surface-active" />
    </div>
  );
}

function Inner({ mode, role }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const supabase = createClient();

      if (mode === 'signup') {
        // Where Supabase sends them after they click the confirmation link.
        const next = nextParam ?? (role ? `/onboarding/${role}` : '/');
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { signup_role: role ?? null },
          },
        });
        if (signErr) {
          setError(humaniseAuthError(signErr.message));
          return;
        }
        setInfo(`Check ${email} for a confirmation link. Click it to finish signing up.`);
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) {
          setError(humaniseAuthError(signErr.message));
          return;
        }
        // Where to go next: explicit ?next= wins; otherwise route by role.
        const dest = nextParam ?? '/post-login';
        router.push(dest);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        type="email"
        name="email"
        autoComplete="email"
        label="Email"
        leftIcon={<Mail className="h-4 w-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={pending}
      />
      <Input
        type={showPw ? 'text' : 'password'}
        name="password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        label="Password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
        minLength={8}
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
      {error && (
        <p className="text-sm text-danger" role="alert">{error}</p>
      )}
      {info && (
        <p className={cn('text-sm text-success leading-relaxed')}>{info}</p>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {mode === 'signup' ? 'Create account' : 'Log in'}
      </Button>
    </form>
  );
}

function humaniseAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (m.includes('user already registered')) return 'An account with that email already exists. Try logging in instead.';
  if (m.includes('email not confirmed')) return "Almost there — check your email for the confirmation link.";
  if (m.includes('password') && m.includes('characters')) return 'Password must be at least 8 characters.';
  return message;
}
