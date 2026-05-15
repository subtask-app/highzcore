// /worker/tasks/[id]/insights — worker's completion flow for an Insights task.
//
// The worker must:
//   1. Have already claimed this task (status='claimed')
//   2. Watch enough of the video (60% / max 5 min — enforced client-side)
//   3. Answer required questions
//   4. Submit

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, ProductBadge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchTaskWithProject } from '@/lib/worker/queries';
import { fetchInsightsProject } from '@/lib/insights/queries';
import { InsightsStudyClient } from './InsightsStudyClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerInsightsTaskPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const task = await fetchTaskWithProject(id);
  if (!task) notFound();
  if (task.assigned_to !== user.id) {
    redirect(`/worker/tasks/${id}`);
  }
  if (task.status !== 'claimed') {
    redirect(`/worker/tasks/${id}`);
  }
  if (!task.project || task.project.type !== 'insights') {
    redirect(`/worker/tasks/${id}`);
  }

  const insights = await fetchInsightsProject(task.project.id);
  if (!insights || !insights.study) notFound();
  const videoId = insights.project.video_id;
  const videoSeconds = insights.project.video_duration_seconds ?? 0;

  if (!videoId) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Card padding="md">
          <p className="text-sm text-fg">This project doesn't have a video attached. Reach out to support.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/worker/tasks/${id}`} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Task details
      </Link>

      <header className="flex items-start gap-3">
        <ProductBadge product="insights" size="md" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">
            {insights.project.title}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Watch the video, then answer the questions. Payout: ${Number(task.worker_payout_usd).toFixed(2)}.
          </p>
        </div>
      </header>

      <InsightsStudyClient
        taskId={task.id}
        videoId={videoId}
        videoSeconds={videoSeconds}
        questions={insights.study.questions}
      />
    </div>
  );
}
