'use client';

// Single submitted-task row in the admin moderation queue. Renders the
// product-specific payload + approve/reject buttons.

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { Badge, Button, Card, ProductBadge, Textarea } from '@/components/ui';
import { approveTaskAction, rejectTaskAction } from '@/lib/admin/actions';
import type { AdminTaskRow } from '@/lib/admin/queries';
import { cn } from '@/lib/utils';

interface InsightAnswer { question_id: string; value: string | number | null }
interface InsightsPayload { answers?: InsightAnswer[]; watch_seconds?: number; total_seconds?: number }
interface AbtestPayload { variant_id?: string; reason?: string }
interface PromotePayload { platform?: string; post_url?: string; audience_id?: string }

export function TaskModerationRow({ task }: { task: AdminTaskRow }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const r = await approveTaskAction(task.id);
      if ('error' in r) setError(r.error);
    });
  };
  const onReject = () => {
    if (reason.trim().length < 3) { setError('Reason is required.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await rejectTaskAction(task.id, reason);
      if ('error' in r) setError(r.error);
    });
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-3 flex-wrap">
        {task.project_type && <ProductBadge product={task.project_type} size="sm" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">{task.project_title ?? 'Project'}</p>
          <p className="text-xs text-fg-muted">
            {task.worker_name ?? task.worker_email ?? task.assigned_to ?? 'Worker'} ·
            {' '}submitted {task.submitted_at && new Date(task.submitted_at).toLocaleString('en')}
          </p>
        </div>
        <Badge tone="warning" size="sm">${Number(task.worker_payout_usd).toFixed(2)} payout</Badge>
      </div>

      <div className="mt-4">
        {task.project_type === 'insights' && <InsightsPayloadView payload={task.response as InsightsPayload | null} />}
        {task.project_type === 'abtest' && <AbtestPayloadView payload={task.response as AbtestPayload | null} />}
        {task.project_type === 'promote' && <PromotePayloadView payload={task.response as PromotePayload | null} evidenceUrl={task.evidence_url} />}
      </div>

      {showReject ? (
        <div className="mt-4 space-y-3">
          <Textarea
            label="Reject reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Tell the worker why so they can do better next time."
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={onReject} variant="danger" loading={pending}>Confirm reject</Button>
            <Button onClick={() => { setShowReject(false); setError(null); }} variant="ghost">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={onApprove} loading={pending} leftIcon={<Check className="h-4 w-4" />}>
            Approve + pay
          </Button>
          <Button onClick={() => setShowReject(true)} variant="secondary" leftIcon={<X className="h-4 w-4" />}>
            Reject
          </Button>
          {error && <span className="text-xs text-danger self-center">{error}</span>}
        </div>
      )}
    </Card>
  );
}

function InsightsPayloadView({ payload }: { payload: InsightsPayload | null }) {
  if (!payload) return <p className="text-xs text-fg-subtle">No payload.</p>;
  return (
    <div className="space-y-2 rounded-md bg-surface-hover p-3">
      <p className="text-xs text-fg-muted">
        Watched {payload.watch_seconds ?? 0}s of {payload.total_seconds ?? 0}s
      </p>
      <div className="space-y-2">
        {(payload.answers ?? []).map((a, i) => (
          <div key={i}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle">{a.question_id}</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{String(a.value ?? '—')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbtestPayloadView({ payload }: { payload: AbtestPayload | null }) {
  if (!payload) return <p className="text-xs text-fg-subtle">No payload.</p>;
  return (
    <div className="rounded-md bg-surface-hover p-3">
      <p className="text-sm text-fg">
        Voted: <strong>{payload.variant_id ?? '—'}</strong>
      </p>
      {payload.reason && <p className="mt-1 text-xs text-fg-muted">{payload.reason}</p>}
    </div>
  );
}

function PromotePayloadView({ payload, evidenceUrl }: { payload: PromotePayload | null; evidenceUrl: string | null }) {
  return (
    <div className="space-y-3">
      {payload?.post_url && (
        <a href={payload.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand">
          {payload.post_url} <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {payload?.platform && <p className="text-xs text-fg-muted">Platform: {payload.platform}</p>}
      {evidenceUrl && (
        <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Image
            src={evidenceUrl}
            alt="Evidence"
            width={240}
            height={160}
            className={cn('rounded-md border border-border object-cover')}
          />
        </a>
      )}
    </div>
  );
}
