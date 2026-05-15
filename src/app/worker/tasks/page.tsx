// /worker/tasks — task feed: two tabs (Available + Mine).

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase, ListChecks } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { TaskCard } from '@/components/worker/TaskCard';
import { createClient } from '@/lib/supabase/server';
import {
  fetchAvailableTasks,
  fetchMyTasks,
  fetchWorkerContext,
} from '@/lib/worker/queries';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ tab?: 'available' | 'mine' }>;
}

export default async function WorkerTasksPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const sp = await searchParams;
  const tab = sp.tab === 'mine' ? 'mine' : 'available';

  const [available, mine] = await Promise.all([
    tab === 'available' ? fetchAvailableTasks(ctx.profile, 50) : Promise.resolve([]),
    tab === 'mine' ? fetchMyTasks(user.id, 50) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Tasks</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Earn by completing tasks. Each one's payout is shown up-front.
        </p>
      </header>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-full border border-border bg-surface">
        <TabLink href="/worker/tasks?tab=available" active={tab === 'available'} label="Available" />
        <TabLink href="/worker/tasks?tab=mine"      active={tab === 'mine'}      label="My tasks" />
      </div>

      {tab === 'available' ? (
        available.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<Briefcase className="h-7 w-7" strokeWidth={1.5} />}
              title="No tasks available"
              description="Try again in a few minutes — new tasks are dropping all the time."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {available.map((t) => (
              <TaskCard key={t.id} task={t} showStatus={false} />
            ))}
          </div>
        )
      ) : (
        mine.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<ListChecks className="h-7 w-7" strokeWidth={1.5} />}
              title="No active tasks"
              description="When you claim a task, it'll show up here."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
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
