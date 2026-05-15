// /worker — home. Earnings at a glance, recent tasks, next task CTA.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Briefcase, ListChecks, Wallet, Trophy } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  StatCard,
} from '@/components/ui';
import { TaskCard } from '@/components/worker/TaskCard';
import { createClient } from '@/lib/supabase/server';
import {
  fetchAvailableTasks,
  fetchMyTasks,
  fetchWorkerContext,
  fetchWorkerStats,
} from '@/lib/worker/queries';

export const dynamic = 'force-dynamic';

export default async function WorkerHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx || !ctx.profile) redirect('/login');

  const [stats, available, mine] = await Promise.all([
    fetchWorkerStats(user.id, ctx.profile),
    fetchAvailableTasks(ctx.profile, 4),
    fetchMyTasks(user.id, 4),
  ]);

  const firstName = ctx.user.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-12">
      {/* Greeting + tier */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle inline-flex items-center gap-2">
            Worker · <TierBadge tier={ctx.profile.tier} />
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-fg mt-2">
            Hey, {firstName}.
          </h1>
          <p className="mt-2 text-base md:text-lg text-fg-muted leading-relaxed max-w-xl">
            {stats.tasksToday > 0
              ? `You've completed ${stats.tasksToday} task${stats.tasksToday === 1 ? '' : 's'} today. Keep going.`
              : "Ready to earn today? Available tasks are listed below."}
          </p>
        </div>
        <LinkButton href="/worker/tasks" leftIcon={<Briefcase className="h-4 w-4" />} size="lg">
          See all tasks
        </LinkButton>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Available balance"
          value={stats.earningsBalance}
          decimals={2}
          prefix="$"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Pending (in review)"
          value={stats.pendingBalance}
          decimals={2}
          prefix="$"
          icon={<ListChecks className="h-4 w-4" />}
        />
        <StatCard
          label="Tasks today"
          value={stats.tasksToday}
          icon={<Briefcase className="h-4 w-4" />}
          accent="var(--c-product-insights)"
        />
        <StatCard
          label="Lifetime earned"
          value={stats.lifetimeEarned}
          decimals={2}
          prefix="$"
          icon={<Trophy className="h-4 w-4" />}
        />
      </section>

      {/* Available tasks */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Available now</h2>
          {available.length > 0 && (
            <Link href="/worker/tasks" className="text-sm text-brand font-semibold inline-flex items-center gap-1">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {available.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<Briefcase className="h-7 w-7" strokeWidth={1.5} />}
              title="No tasks right now"
              description="We'll ping your Telegram as soon as new tasks matching your niches drop."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {available.map((t) => (
              <TaskCard key={t.id} task={t} showStatus={false} />
            ))}
          </div>
        )}
      </section>

      {/* My tasks */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Your recent tasks</h2>
        </div>
        {mine.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<ListChecks className="h-7 w-7" strokeWidth={1.5} />}
              title="No tasks yet"
              description="Once you claim a task, it'll show here until it's approved or expires."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TierBadge({ tier }: { tier: 'A' | 'B' | 'C' }) {
  const tone = tier === 'A' ? 'success' : tier === 'B' ? 'info' : 'neutral';
  return <Badge tone={tone} size="xs">Tier {tier}</Badge>;
}
