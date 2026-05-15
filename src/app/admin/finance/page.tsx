// /admin/finance — financial overview + withdrawals queue.

import Link from 'next/link';
import { Card, StatCard } from '@/components/ui';
import { WithdrawalRow } from '@/components/admin/WithdrawalRow';
import { fetchAdminFinance, fetchWithdrawalsQueue } from '@/lib/admin/queries';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ wstatus?: string }>;
}

export default async function AdminFinancePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const wstatus = (sp.wstatus as 'requested' | 'processing' | 'completed' | 'failed' | undefined) ?? 'requested';

  const [finance, withdrawals] = await Promise.all([
    fetchAdminFinance(),
    fetchWithdrawalsQueue(wstatus, 50),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Finance</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Money in, money out, money owed.
        </p>
      </header>

      {/* Top stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Platform revenue"      value={finance.platformRevenueUsd}        decimals={2} prefix="$" />
        <StatCard label="Escrow held"           value={finance.totalEscrowHeldUsd}        decimals={2} prefix="$" />
        <StatCard label="Pending worker balances" value={finance.pendingWorkerBalancesUsd} decimals={2} prefix="$" />
        <StatCard label="Available to workers"  value={finance.availableWorkerBalancesUsd} decimals={2} prefix="$" />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Card padding="md" className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Revenue by product</h3>
          <ul className="space-y-1.5">
            {Object.entries(finance.revenueByType).map(([type, amount]) => (
              <li key={type} className="flex items-baseline justify-between text-sm">
                <span className="capitalize text-fg-muted">{type}</span>
                <span className="font-mono tabular text-fg">${amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md" className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Withdrawals by status</h3>
          {Object.keys(finance.withdrawalsByStatus).length === 0 ? (
            <p className="text-sm text-fg-muted">No withdrawals yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(finance.withdrawalsByStatus).map(([status, { count, amount }]) => (
                <li key={status} className="flex items-baseline justify-between text-sm">
                  <span className="capitalize text-fg-muted">{status}</span>
                  <span className="font-mono tabular text-fg">
                    {count} · ${amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-fg-subtle pt-1">Lifetime paid out: ${finance.lifetimePaidOutUsd.toFixed(2)}</p>
        </Card>
      </section>

      <section id="withdrawals" className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Withdrawals</h2>
        <div className="inline-flex p-1 rounded-full border border-border bg-surface">
          {(['requested', 'processing', 'completed', 'failed'] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/finance?wstatus=${s}#withdrawals`}
              className={cn(
                'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium transition-colors capitalize',
                wstatus === s ? 'bg-brand text-brand-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {s}
            </Link>
          ))}
        </div>
        {withdrawals.length === 0 ? (
          <Card padding="md"><p className="text-sm text-fg-muted">No {wstatus} withdrawals.</p></Card>
        ) : (
          <div className="grid gap-3">
            {withdrawals.map((w) => <WithdrawalRow key={w.id} w={w} />)}
          </div>
        )}
      </section>
    </div>
  );
}
