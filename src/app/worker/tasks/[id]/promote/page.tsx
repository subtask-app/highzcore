// /worker/tasks/[id]/promote — Promote share submission flow.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, ProductBadge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchTaskWithProject } from '@/lib/worker/queries';
import { fetchEligibleAudiences, fetchPromoteProject } from '@/lib/promote/queries';
import { PromoteShareForm } from '@/components/promote/PromoteShareForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerPromoteTaskPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const task = await fetchTaskWithProject(id);
  if (!task) notFound();
  if (task.assigned_to !== user.id) redirect(`/worker/tasks/${id}`);
  if (task.status !== 'claimed') redirect(`/worker/tasks/${id}`);
  if (!task.project || task.project.type !== 'promote') redirect(`/worker/tasks/${id}`);

  const promote = await fetchPromoteProject(task.project.id);
  if (!promote?.campaign || !promote.project.video_url) notFound();

  const eligible = await fetchEligibleAudiences(
    user.id,
    promote.campaign.target_platforms,
    promote.campaign.min_audience_per_share,
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/worker/tasks/${id}`} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Task details
      </Link>

      <header className="flex items-start gap-3">
        <ProductBadge product="promote" size="md" />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">
            {promote.project.title}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Share to your verified audience. Payout: ${Number(task.worker_payout_usd).toFixed(2)}.
            Min followers required: {promote.campaign.min_audience_per_share.toLocaleString()}.
          </p>
        </div>
      </header>

      <Card padding="lg">
        <PromoteShareForm
          taskId={task.id}
          videoUrl={promote.project.video_url}
          utmCampaign={promote.campaign.utm_campaign}
          shareMessage={promote.campaign.share_message_template}
          eligibleAudiences={eligible}
        />
      </Card>
    </div>
  );
}
