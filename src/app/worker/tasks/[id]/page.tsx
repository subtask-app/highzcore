// /worker/tasks/[id] — task detail. The per-product completion flow ships
// in M6-M9; this page covers what every task shares (the project's video,
// the payout, status, claim/submit CTAs).

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react';
import { Badge, Card, LinkButton, ProductBadge, productLabel } from '@/components/ui';
import { ClaimTaskButton } from '@/components/worker/ClaimTaskButton';
import { createClient } from '@/lib/supabase/server';
import { fetchTaskWithProject, fetchWorkerContext } from '@/lib/worker/queries';
import type { TaskStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  available: 'Available',
  claimed:   'Claimed',
  submitted: 'Awaiting review',
  approved:  'Approved',
  rejected:  'Rejected',
  expired:   'Expired',
};

export default async function WorkerTaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const task = await fetchTaskWithProject(id);
  if (!task) notFound();

  const mine = task.assigned_to === user.id;
  const project = task.project;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/worker/tasks" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All tasks
      </Link>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          {project && <ProductBadge product={project.type} size="lg" />}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">
              {project?.title ?? 'Task'}
            </h1>
            <p className="text-sm text-fg-muted mt-1 inline-flex items-center gap-2">
              {project && <span>{productLabel(project.type)}</span>}
              <span aria-hidden>·</span>
              <Clock className="h-3 w-3" />
              {new Date(task.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <Badge tone={mine ? 'success' : 'brand'}>{STATUS_LABEL[task.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <Field label="Payout" value={`$${Number(task.worker_payout_usd).toFixed(2)}`} accent />
          {task.claimed_at && (
            <Field label="Claimed at" value={new Date(task.claimed_at).toLocaleString('en')} />
          )}
          {task.submitted_at && (
            <Field label="Submitted at" value={new Date(task.submitted_at).toLocaleString('en')} />
          )}
          {task.approved_at && (
            <Field label="Approved at" value={new Date(task.approved_at).toLocaleString('en')} />
          )}
        </div>

        {project?.video_url && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-2">
              Target video
            </p>
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand font-semibold"
            >
              Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </Card>

      {/* Action area — depends on status + product type. */}
      <Card padding="lg">
        <p className="text-sm text-fg leading-relaxed">
          {task.status === 'available' && 'Claim this task to lock it for the next 2 hours and start working.'}
          {task.status === 'claimed'  && (
            project?.type === 'insights'
              ? 'You have this task. Watch the video and answer the questions to earn your payout.'
              : 'You have this task. The completion form for this product type will live here once M7–M9 ship.'
          )}
          {task.status === 'submitted' && 'Your response is in. An admin will review and approve within 24 hours; the payout moves from Pending into Available.'}
          {task.status === 'approved' && 'Approved + paid. Check your earnings.'}
          {task.status === 'rejected' && 'This task was rejected. The pending payout was returned and a new slot was opened for another worker.'}
          {task.status === 'expired' && 'This task expired. Browse available tasks to claim another.'}
        </p>

        <div className="mt-4 flex gap-2">
          {task.status === 'available' && project && (
            <ClaimTaskButton taskId={task.id} type={project.type} />
          )}
          {task.status === 'claimed' && project?.type === 'insights' && (
            <LinkButton href={`/worker/tasks/${task.id}/insights`}>Open completion form</LinkButton>
          )}
          {(task.status === 'approved' || task.status === 'rejected' || task.status === 'expired') && (
            <LinkButton href="/worker/tasks" variant="secondary">Find another task</LinkButton>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</dt>
      <dd className={`mt-1 ${accent ? 'text-lg font-mono tabular font-semibold text-success' : 'text-sm text-fg'}`}>{value}</dd>
    </div>
  );
}
