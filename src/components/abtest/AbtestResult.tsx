// Results panel for an ABTest. Server-renderable: takes the test row +
// vote tally and produces a winner + per-variant bars + significance flag.

import Image from 'next/image';
import { Check } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import type { AbtestTestRow } from '@/lib/supabase/types';
import { summarize } from '@/lib/abtest/statistics';
import { cn } from '@/lib/utils';

interface Props {
  test: AbtestTestRow;
  votesById: Record<string, number>;
}

export function AbtestResult({ test, votesById }: Props) {
  const summary = summarize(
    Object.fromEntries(test.variants.map((v) => [v.id, votesById[v.id] ?? 0])),
  );
  const winnerId = summary.totalVotes > 0 ? summary.winnerId : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-fg-muted">
          {summary.totalVotes === 0
            ? 'No votes yet.'
            : `${summary.totalVotes} vote${summary.totalVotes === 1 ? '' : 's'} so far${summary.significant ? ' · statistically significant winner' : ''}.`}
        </p>
        {summary.significant && summary.totalVotes > 0 && (
          <Badge tone="success">Winner: {test.variants.find((v) => v.id === winnerId)?.label}</Badge>
        )}
      </div>
      <div className={cn(
        'grid gap-3',
        test.variants.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-' + Math.min(test.variants.length, 4),
      )}>
        {test.variants.map((v) => {
          const result = summary.results.find((r) => r.id === v.id);
          const isWinner = winnerId === v.id;
          return (
            <Card key={v.id} padding="md" className={cn(isWinner && 'ring-2 ring-success')}>
              {test.kind === 'thumbnail' ? (
                <ThumbnailVariant v={v} winner={isWinner} />
              ) : (
                <TitleVariant v={v} winner={isWinner} />
              )}
              <div className="mt-3 space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg-muted">Votes</span>
                  <span className="font-mono tabular text-fg">
                    {result?.votes ?? 0}
                    {summary.totalVotes > 0 && (
                      <span className="text-fg-subtle"> · {Math.round((result?.share ?? 0) * 100)}%</span>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-active overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', isWinner ? 'bg-success' : 'bg-brand')}
                    style={{ width: `${(result?.share ?? 0) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {summary.totalVotes > 0 && !summary.significant && (
        <p className="text-xs text-fg-subtle text-center">
          Lead isn't statistically significant yet — wait for more votes or run a deeper tier next time.
        </p>
      )}
    </div>
  );
}

function ThumbnailVariant({ v, winner }: { v: { id: string; label: string; image_url?: string | null }; winner: boolean }) {
  return (
    <div>
      <div className="relative aspect-video rounded-md overflow-hidden bg-surface-active">
        {v.image_url ? (
          <Image src={v.image_url} alt={v.label} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        ) : null}
        {winner && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-success text-paper px-2 py-0.5 text-[10px] font-bold">
            <Check className="h-3 w-3" /> Winner
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold text-fg">{v.label}</p>
    </div>
  );
}

function TitleVariant({ v, winner }: { v: { id: string; label: string; text?: string | null }; winner: boolean }) {
  return (
    <div>
      <div className="relative rounded-md border border-border bg-surface p-4 min-h-[80px]">
        <p className="text-base font-semibold text-fg leading-snug">{v.text}</p>
        {winner && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-success text-paper px-2 py-0.5 text-[10px] font-bold">
            <Check className="h-3 w-3" /> Winner
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-fg-subtle uppercase tracking-[0.18em] font-semibold">{v.label}</p>
    </div>
  );
}
