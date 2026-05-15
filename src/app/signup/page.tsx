'use client';

// /signup — role chooser. Two cards, "I'm a creator" vs "I'm a worker".
// Picking a role sets the intent cookie (server action) and pushes to the
// per-role signup form.

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Card } from '@/components/ui';
import { setRoleIntent, type RoleIntent } from '@/lib/auth/actions';

export default function SignupChooserPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pick = (role: RoleIntent) => {
    startTransition(async () => {
      await setRoleIntent(role);
      router.push(`/signup/${role}`);
    });
  };

  return (
    <AuthShell
      title="Welcome to Highzcore"
      description="What brings you here today? You can always add the other role later."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold">Log in</Link>
        </>
      }
    >
      <div className="space-y-3">
        <RoleCard
          tone="creator"
          title="I'm a creator"
          description="I make YouTube content and want to understand what my audience really thinks."
          Icon={Sparkles}
          disabled={pending}
          onClick={() => pick('creator')}
        />
        <RoleCard
          tone="worker"
          title="I'm a worker"
          description="I want to earn by watching videos and giving honest feedback to creators."
          Icon={Briefcase}
          disabled={pending}
          onClick={() => pick('worker')}
        />
      </div>
    </AuthShell>
  );
}

function RoleCard({
  tone,
  title,
  description,
  Icon,
  disabled,
  onClick,
}: {
  tone: 'creator' | 'worker';
  title: string;
  description: string;
  Icon: typeof Sparkles;
  disabled?: boolean;
  onClick: () => void;
}) {
  const accent = tone === 'creator' ? 'var(--c-product-insights)' : 'var(--c-product-promote)';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left disabled:opacity-60"
    >
      <Card variant="interactive" padding="md" className="flex items-start gap-4">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-md shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-fg">{title}</p>
          <p className="mt-0.5 text-sm text-fg-muted leading-relaxed">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-fg-muted mt-1.5 shrink-0" />
      </Card>
    </button>
  );
}
