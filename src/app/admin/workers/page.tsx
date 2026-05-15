// /admin/workers — workers list + audience verification queue tab.

import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { fetchAllWorkers, fetchAudienceQueue } from '@/lib/admin/queries';
import { AudienceVerificationRow } from '@/components/admin/AudienceVerificationRow';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TIER_TONE = { A: 'success' as const, B: 'info' as const, C: 'neutral' as const };

export default async function AdminWorkersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === 'audiences' ? 'audiences' : 'list';

  const [workers, audiences] = await Promise.all([
    tab === 'list' ? fetchAllWorkers(200) : Promise.resolve([]),
    tab === 'audiences' ? fetchAudienceQueue('pending') : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Workers</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Browse workers + verify Promote audiences.
        </p>
      </header>

      <div className="inline-flex p-1 rounded-full border border-border bg-surface">
        <Tab href="/admin/workers" active={tab === 'list'}      label="All workers" />
        <Tab href="/admin/workers?tab=audiences" active={tab === 'audiences'} label={`Audience queue${audiences.length ? ` · ${audiences.length}` : ''}`} />
      </div>

      {tab === 'list' ? (
        workers.length === 0 ? (
          <Card padding="md"><p className="text-sm text-fg-muted">No workers yet.</p></Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border">
              {workers.map((w) => (
                <Link
                  key={w.user.id}
                  href={`/admin/workers/${w.user.id}`}
                  className="flex items-center gap-3 px-4 md:px-6 py-3 hover:bg-surface-hover"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">
                      {w.user.full_name ?? w.user.email}
                    </p>
                    <p className="text-xs text-fg-muted truncate">
                      {w.user.country ?? '—'} · earned ${Number(w.profile?.lifetime_earned ?? 0).toFixed(2)} ·{' '}
                      {(w.profile?.completion_rate ?? 1) * 100}% completion
                    </p>
                  </div>
                  {w.profile?.tier && <Badge tone={TIER_TONE[w.profile.tier]} size="xs">Tier {w.profile.tier}</Badge>}
                  {w.user.suspended_at && <Badge tone="danger" size="xs">Suspended</Badge>}
                </Link>
              ))}
            </div>
          </Card>
        )
      ) : audiences.length === 0 ? (
        <Card padding="md"><p className="text-sm text-fg-muted">No pending audiences.</p></Card>
      ) : (
        <div className="grid gap-3">
          {audiences.map((a) => <AudienceVerificationRow key={a.id} audience={a} />)}
        </div>
      )}
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium transition-colors',
        active ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {label}
    </Link>
  );
}
