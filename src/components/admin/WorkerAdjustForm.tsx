'use client';

// Inline scorecards + adjust actions on the worker detail page.

import { useState, useTransition } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import {
  adjustWorkerAction,
  suspendUserAction,
  unsuspendUserAction,
} from '@/lib/admin/actions';
import type { WorkerTier } from '@/lib/supabase/types';

interface Props {
  userId: string;
  tier: WorkerTier;
  reliability: number;
  quality: number;
  isSuspended: boolean;
}

export function WorkerAdjustForm({ userId, tier, reliability, quality, isSuspended }: Props) {
  const [t, setT] = useState<WorkerTier>(tier);
  const [r, setR] = useState<string>(String(reliability));
  const [q, setQ] = useState<string>(String(quality));
  const [reason, setReason] = useState('');
  const [showSuspend, setShowSuspend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null); setInfo(null);
    startTransition(async () => {
      const result = await adjustWorkerAction(userId, {
        tier: t,
        reliability_score: Number(r),
        quality_score: Number(q),
      });
      if ('error' in result) setError(result.error);
      else setInfo('Saved.');
    });
  };

  const suspend = () => {
    if (reason.trim().length < 3) { setError('Reason required.'); return; }
    setError(null); setInfo(null);
    startTransition(async () => {
      const result = await suspendUserAction(userId, reason);
      if ('error' in result) setError(result.error);
      else { setInfo('Suspended.'); setShowSuspend(false); }
    });
  };

  const unsuspend = () => {
    setError(null); setInfo(null);
    startTransition(async () => {
      const result = await unsuspendUserAction(userId);
      if ('error' in result) setError(result.error);
      else setInfo('Unsuspended.');
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <Select
          label="Tier"
          value={t}
          onChange={(e) => setT(e.target.value as WorkerTier)}
          options={[
            { value: 'A', label: 'A — Elite' },
            { value: 'B', label: 'B — Trusted' },
            { value: 'C', label: 'C — Starter' },
          ]}
        />
        <Input
          type="number"
          label="Reliability"
          value={r}
          onChange={(e) => setR(e.target.value)}
          min={0}
          max={100}
        />
        <Input
          type="number"
          label="Quality"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={save} loading={pending}>Save adjustments</Button>
        {info && <span className="text-xs text-success">{info}</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      <div className="border-t border-border pt-4">
        {isSuspended ? (
          <Button onClick={unsuspend} variant="secondary" loading={pending}>
            Lift suspension
          </Button>
        ) : showSuspend ? (
          <div className="space-y-3">
            <Textarea
              label="Suspension reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={suspend} variant="danger" loading={pending}>Confirm suspend</Button>
              <Button onClick={() => setShowSuspend(false)} variant="ghost">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowSuspend(true)} variant="secondary">
            Suspend account…
          </Button>
        )}
      </div>
    </div>
  );
}
