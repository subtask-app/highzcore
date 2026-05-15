// /worker/tasks/[id]/abtest — ABTest voting flow.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, ProductBadge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchTaskWithProject } from '@/lib/worker/queries';
import { fetchAbtestProject } from '@/lib/abtest/queries';
import { AbtestVoteForm } from '@/components/abtest/AbtestVoteForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerAbtestTaskPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const task = await fetchTaskWithProject(id);
  if (!task) notFound();
  if (task.assigned_to !== user.id) redirect(`/worker/tasks/${id}`);
  if (task.status !== 'claimed') redirect(`/worker/tasks/${id}`);
  if (!task.project || task.project.type !== 'abtest') redirect(`/worker/tasks/${id}`);

  const abtest = await fetchAbtestProject(task.project.id);
  if (!abtest?.test) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/worker/tasks/${id}`} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Task details
      </Link>

      <header className="flex items-start gap-3">
        <ProductBadge product="abtest" size="md" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">
            {abtest.project.title}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {abtest.test.kind === 'thumbnail' ? 'Pick the thumbnail you\'d click first.' : 'Pick the title you\'d click first.'} Payout: ${Number(task.worker_payout_usd).toFixed(2)}.
          </p>
        </div>
      </header>

      <Card padding="md">
        <AbtestVoteForm taskId={task.id} kind={abtest.test.kind} variants={abtest.test.variants} />
      </Card>
    </div>
  );
}
