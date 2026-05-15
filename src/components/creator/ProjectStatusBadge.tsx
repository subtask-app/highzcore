// Project status — single source of truth for the chip used wherever a
// project's lifecycle state appears.

import { Badge } from '@/components/ui';
import type { ProjectStatus } from '@/lib/supabase/types';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_TONE: Record<ProjectStatus, Tone> = {
  draft:           'neutral',
  pending_payment: 'warning',
  active:          'success',
  completed:       'info',
  cancelled:       'neutral',
  refunded:        'danger',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft:           'Draft',
  pending_payment: 'Awaiting payment',
  active:          'Live',
  completed:       'Completed',
  cancelled:       'Cancelled',
  refunded:        'Refunded',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
