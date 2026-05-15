// /admin — overview dashboard.

import { ArrowRight, AlertCircle, CheckCircle2, FolderKanban, ShieldCheck, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Card, StatCard } from '@/components/ui';
import { fetchAdminOverview } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const stats = await fetchAdminOverview();

  const queues = [
    { label: 'Tasks awaiting review',     value: stats.tasksAwaitingReview,    href: '/admin/projects?status=submitted' },
    { label: 'Audiences awaiting review', value: stats.audiencesAwaitingReview,href: '/admin/workers?tab=audiences'   },
    { label: 'Withdrawals to process',    value: stats.withdrawalsAwaitingProcess, href: '/admin/finance#withdrawals' },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Admin</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Platform health + open queues.
        </p>
      </header>

      {/* Headline financial stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Platform revenue"
          value={stats.platformRevenueUsd}
          prefix="$"
          decimals={0}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Pending payouts"
          value={stats.pendingPayoutsUsd}
          prefix="$"
          decimals={0}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard
          label="Active projects"
          value={stats.projectsActive}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <StatCard
          label="Completed projects"
          value={stats.projectsCompleted}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </section>

      {/* Population stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total users"    value={stats.users}    icon={<Users className="h-4 w-4" />} />
        <StatCard label="Creators"       value={stats.creators} accent="var(--c-product-insights)" />
        <StatCard label="Workers"        value={stats.workers}  accent="var(--c-product-promote)" />
      </section>

      {/* Open queues */}
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Open queues</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {queues.map((q) => (
            <Link key={q.label} href={q.href} className="block">
              <Card variant="interactive" padding="md">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{q.label}</p>
                <p className="mt-1 font-mono tabular text-3xl font-semibold text-fg">{q.value}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand font-semibold">
                  Open queue <ArrowRight className="h-3 w-3" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/finance" className="block">
          <Card variant="interactive" padding="md">
            <p className="font-semibold text-fg">Finance</p>
            <p className="text-sm text-fg-muted mt-1">Escrow, withdrawals, revenue by product.</p>
          </Card>
        </Link>
        <Link href="/admin/audit" className="block">
          <Card variant="interactive" padding="md">
            <p className="font-semibold text-fg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Audit log
            </p>
            <p className="text-sm text-fg-muted mt-1">Every admin action, who did it, when.</p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
