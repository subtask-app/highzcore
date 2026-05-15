// /admin/workers/[id] — worker detail. Profile, scores, ledger, audiences,
// adjustments + suspend.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Avatar, Badge, Card, ProgressRing } from '@/components/ui';
import { WorkerAdjustForm } from '@/components/admin/WorkerAdjustForm';
import { fetchWorker, fetchWorkerAudiences, fetchWorkerLedger } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmt(n: number) { return `$${Number(n).toFixed(2)}`; }
function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default async function AdminWorkerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const worker = await fetchWorker(id);
  if (!worker) notFound();
  const [ledger, audiences] = await Promise.all([
    fetchWorkerLedger(id),
    fetchWorkerAudiences(id),
  ]);

  const p = worker.profile;
  if (!p) {
    return (
      <Card padding="md"><p className="text-sm text-fg-muted">No worker profile.</p></Card>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/workers" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All workers
      </Link>

      <header className="flex items-start gap-4 flex-wrap">
        <Avatar src={worker.user.avatar_url ?? undefined} name={worker.user.full_name ?? worker.user.email} size="2xl" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">
            {worker.user.full_name ?? worker.user.email}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{worker.user.email}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={p.tier === 'A' ? 'success' : p.tier === 'B' ? 'info' : 'neutral'} size="sm">Tier {p.tier}</Badge>
            {worker.user.country && <Badge tone="neutral" size="sm">{worker.user.country}</Badge>}
            {worker.user.suspended_at && <Badge tone="danger" size="sm">Suspended</Badge>}
          </div>
          {worker.user.suspended_reason && (
            <p className="mt-2 text-xs text-danger">Reason: {worker.user.suspended_reason}</p>
          )}
        </div>
      </header>

      {/* Money + scores */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Block label="Available" value={fmt(Number(p.earnings_balance))} />
        <Block label="Pending" value={fmt(Number(p.pending_balance))} />
        <Block label="Lifetime earned" value={fmt(Number(p.lifetime_earned))} />
        <Block label="Lifetime paid out" value={fmt(Number(p.lifetime_withdrawn))} />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card padding="md" className="flex items-center gap-4">
          <ProgressRing value={p.reliability_score / 100} label={`${p.reliability_score}`} size={60} strokeWidth={6} />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Reliability</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-4">
          <ProgressRing value={p.quality_score / 100} label={`${p.quality_score}`} size={60} strokeWidth={6} color="var(--c-product-insights)" />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Quality</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-4">
          <ProgressRing value={p.completion_rate} label={`${Math.round(p.completion_rate * 100)}%`} size={60} strokeWidth={6} color="var(--c-product-promote)" />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Completion</p>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Adjustments</h2>
        <Card padding="lg">
          <WorkerAdjustForm
            userId={worker.user.id}
            tier={p.tier}
            reliability={p.reliability_score}
            quality={p.quality_score}
            isSuspended={!!worker.user.suspended_at}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Audiences</h2>
        {audiences.length === 0 ? (
          <Card padding="md"><p className="text-sm text-fg-muted">No audiences linked.</p></Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border">
              {audiences.map((a) => (
                <div key={a.id} className="px-4 md:px-6 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg">{a.platform} · @{a.handle}</p>
                    <p className="text-xs text-fg-muted">
                      {a.verified_follower_count?.toLocaleString() ?? '?'} followers ·
                      {' '}{a.status}
                    </p>
                  </div>
                  <Badge tone={a.status === 'verified' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'} size="xs">
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Recent ledger</h2>
        {ledger.length === 0 ? (
          <Card padding="md"><p className="text-sm text-fg-muted">No ledger entries.</p></Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border">
              {ledger.map((e) => {
                const positive = Number(e.amount_usd) > 0;
                return (
                  <div key={e.id} className="px-4 md:px-6 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-fg">{e.entry_type}{e.description ? ` — ${e.description}` : ''}</p>
                      <p className="text-xs text-fg-muted">{fmtDate(e.created_at)}</p>
                    </div>
                    <span className={`font-mono text-sm font-semibold tabular ${positive ? 'text-success' : 'text-fg'}`}>
                      {positive ? '+' : ''}${Number(e.amount_usd).toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</p>
      <p className="mt-1 font-mono tabular text-xl font-semibold text-fg">{value}</p>
    </Card>
  );
}
