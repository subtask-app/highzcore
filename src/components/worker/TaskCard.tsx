// Task card — used in worker task feed + my-tasks list.

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge, Card, ProductBadge, productLabel } from '@/components/ui';
import type { TaskStatus } from '@/lib/supabase/types';
import type { TaskWithProject } from '@/lib/worker/queries';
import { cn } from '@/lib/utils';

function payoutLabel(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

const STATUS_TONE: Record<TaskStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'> = {
  available: 'brand',
  claimed:   'warning',
  submitted: 'info',
  approved:  'success',
  rejected:  'danger',
  expired:   'neutral',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  available: 'Available',
  claimed:   'Claimed by you',
  submitted: 'Awaiting review',
  approved:  'Approved',
  rejected:  'Rejected',
  expired:   'Expired',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TaskCard({ task, showStatus = true }: { task: TaskWithProject; showStatus?: boolean }) {
  const project = task.project;
  return (
    <Link href={`/worker/tasks/${task.id}`} className="block">
      <Card variant="interactive" padding="md" className="flex items-start gap-4">
        {project && <ProductBadge product={project.type} size="md" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold text-fg truncate">
                {project?.title ?? 'Task'}
              </p>
              <p className="text-xs text-fg-subtle mt-0.5 inline-flex items-center gap-2">
                <span>{project ? productLabel(project.type) : ''}</span>
                <span aria-hidden="true">·</span>
                <Clock className="h-3 w-3" />
                <span>{timeAgo(task.created_at)}</span>
              </p>
            </div>
            {showStatus && (
              <Badge tone={STATUS_TONE[task.status]} size="sm">{STATUS_LABEL[task.status]}</Badge>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center h-7 px-3 rounded-full text-xs font-bold font-mono tabular',
              'bg-success/10 text-success',
            )}>
              {payoutLabel(Number(task.worker_payout_usd))}
            </span>
            <span className="text-xs text-fg-muted">payout when approved</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-fg-subtle mt-1 shrink-0" />
      </Card>
    </Link>
  );
}
