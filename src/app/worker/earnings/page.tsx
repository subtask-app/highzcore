// /worker/earnings — balance, ledger, withdrawal history, withdraw CTA.

import { redirect } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { Badge, Card, EmptyState, LinkButton, StatCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import {
  fetchLedger,
  fetchWithdrawals,
  fetchWorkerContext,
  fetchWorkerStats,
} from '@/lib/worker/queries';
import type { LedgerEntryType, WithdrawalStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const WITHDRAWAL_TONE: Record<WithdrawalStatus, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  requested:  'warning',
  processing: 'info',
  completed:  'success',
  failed:     'danger',
  cancelled:  'neutral',
};

function formatUsd(n: number, decimals = 2): string {
  return `$${n.toFixed(decimals)}`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LEDGER_LABEL: Record<LedgerEntryType, string> = {
  earning:    'Task earning',
  withdrawal: 'Withdrawal',
  refund:     'Refund',
  bonus:      'Bonus',
  penalty:    'Penalty',
  adjustment: 'Adjustment',
};

export default async function WorkerEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const [stats, ledger, withdrawals] = await Promise.all([
    fetchWorkerStats(user.id, ctx.profile),
    fetchLedger(user.id),
    fetchWithdrawals(user.id),
  ]);

  const canWithdraw = stats.earningsBalance >= 10;

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Earnings</h1>
          <p className="mt-2 text-sm md:text-base text-fg-muted">
            Withdraw anytime your available balance is $10 or more. USDT TRC20 only.
          </p>
        </div>
        <LinkButton
          href="/worker/earnings/withdraw"
          size="lg"
          variant={canWithdraw ? 'primary' : 'secondary'}
        >
          Withdraw
        </LinkButton>
      </header>

      {/* Top stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available" value={stats.earningsBalance} decimals={2} prefix="$" />
        <StatCard label="Pending" value={stats.pendingBalance} decimals={2} prefix="$" />
        <StatCard label="Lifetime earned" value={stats.lifetimeEarned} decimals={2} prefix="$" />
        <StatCard label="Tasks completed" value={stats.tasksCompletedTotal} />
      </section>

      {/* Withdrawals history */}
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Withdrawals</h2>
        {withdrawals.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<ArrowUpRight className="h-7 w-7" strokeWidth={1.5} />}
              title="No withdrawals yet"
              description="When you cash out, the on-chain transactions will show up here."
            />
          </Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-4 md:px-6 py-4">
                  <ArrowUpRight className="h-5 w-5 text-fg-subtle" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg">{formatUsd(Number(w.amount_usd))}</p>
                    <p className="text-xs text-fg-muted truncate">
                      → {w.destination_address.slice(0, 8)}…{w.destination_address.slice(-6)} ·{' '}
                      {formatDate(w.requested_at)}
                      {w.provider_tx_hash && (
                        <> · <a className="text-brand" href={`https://tronscan.org/#/transaction/${w.provider_tx_hash}`} target="_blank" rel="noopener noreferrer">tx</a></>
                      )}
                    </p>
                  </div>
                  <Badge tone={WITHDRAWAL_TONE[w.status]} size="sm">{w.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Ledger */}
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Recent activity</h2>
        {ledger.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<Receipt className="h-7 w-7" strokeWidth={1.5} />}
              title="No activity yet"
              description="Earnings + withdrawals appear here as soon as they happen."
            />
          </Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border">
              {ledger.map((e) => {
                const positive = Number(e.amount_usd) > 0;
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 md:px-6 py-4">
                    {positive ? (
                      <ArrowDownLeft className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-fg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg">
                        {LEDGER_LABEL[e.entry_type]}
                        {e.description && <span className="text-fg-muted"> · {e.description}</span>}
                      </p>
                      <p className="text-xs text-fg-subtle">{formatDate(e.created_at)}</p>
                    </div>
                    <span className={`font-mono tabular text-sm font-semibold shrink-0 ${positive ? 'text-success' : 'text-fg'}`}>
                      {positive ? '+' : ''}{formatUsd(Number(e.amount_usd), 4)}
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
