'use client';

// Small inline button that claims a task via the RPC, then navigates the
// worker into the per-product completion flow.

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { claimInsightsTask } from '@/lib/insights/actions';
import type { ProjectType } from '@/lib/supabase/types';

interface Props {
  taskId: string;
  type: ProjectType;
}

export function ClaimTaskButton({ taskId, type }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      // All product types currently share the same claim path; the per-product
      // flows diverge after the task moves to 'claimed'.
      const result = await claimInsightsTask(taskId);
      if ('error' in result) {
        router.refresh();
        return;
      }
      const next =
        type === 'insights' ? `/worker/tasks/${taskId}/insights`
        : type === 'abtest' ? `/worker/tasks/${taskId}/abtest`
        : type === 'promote' ? `/worker/tasks/${taskId}/promote`
        : `/worker/tasks/${taskId}`;
      router.push(next);
      router.refresh();
    });
  };

  return (
    <Button onClick={onClick} loading={pending}>Claim task</Button>
  );
}
