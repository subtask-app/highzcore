'use client';

// Worker voting UI for an ABTest. Shuffles variants client-side on mount
// to prevent positional bias, then submits the chosen variant id via
// submitAbtestVote.

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { Button, Card, Textarea } from '@/components/ui';
import type { AbtestKind, AbtestVariant } from '@/lib/supabase/types';
import { submitAbtestVote } from '@/lib/abtest/actions';
import { cn } from '@/lib/utils';

interface Props {
  taskId: string;
  kind: AbtestKind;
  variants: AbtestVariant[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AbtestVoteForm({ taskId, kind, variants }: Props) {
  // Stable random order across re-renders of the same mount.
  const ordered = useMemo(() => shuffle(variants), [variants]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset error when the worker changes pick.
  useEffect(() => { if (chosen) setError(null); }, [chosen]);

  const submit = () => {
    if (!chosen) { setError('Pick one to continue.'); return; }
    startTransition(async () => {
      const result = await submitAbtestVote(taskId, { variant_id: chosen, reason: reason.trim() || undefined });
      if ('error' in result) setError(humanise(result.error));
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-fg-muted">
        Which one would you click? Pick the one that catches your eye first —
        you can change your mind before submitting.
      </p>

      <div className={cn(
        'grid gap-3',
        ordered.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-' + Math.min(ordered.length, 4),
      )}>
        {ordered.map((v) => {
          const selected = chosen === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setChosen(v.id)}
              className="w-full text-left"
              aria-pressed={selected}
            >
              <Card
                padding="md"
                variant="interactive"
                className={cn('h-full', selected && 'ring-2 ring-brand')}
              >
                {kind === 'thumbnail' ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-surface-active">
                    {v.image_url ? (
                      <Image
                        src={v.image_url}
                        alt={v.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : null}
                    {selected && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-brand text-brand-fg px-2 py-0.5 text-[10px] font-bold">
                        <Check className="h-3 w-3" /> Picked
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    'rounded-md border p-4 min-h-[100px]',
                    selected ? 'border-brand bg-brand-tint' : 'border-border bg-surface',
                  )}>
                    <p className="text-base font-semibold text-fg leading-snug">{v.text}</p>
                  </div>
                )}
              </Card>
            </button>
          );
        })}
      </div>

      <Textarea
        label="Why did you pick that one? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="A short sentence helps the creator understand the choice."
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={submit} size="lg" fullWidth loading={pending} disabled={!chosen}>
        Submit vote
      </Button>
      <p className="text-xs text-fg-subtle text-center">
        Your payout moves into Pending once you submit, and lands in your balance after admin approval.
      </p>
    </div>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'variant_required':  return 'Pick a variant first.';
    case 'not_authenticated': return 'Your session expired. Log in again.';
    default:                  return `Something went wrong: ${code}.`;
  }
}
