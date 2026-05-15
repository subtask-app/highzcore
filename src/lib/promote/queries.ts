// Promote server queries.

import { serviceClient } from '@/lib/supabase/service';
import type {
  AudiencePlatform,
  Database,
  ProjectRow,
  PromoteCampaignRow,
  TaskRow,
  WorkerAudienceRow,
} from '@/lib/supabase/types';

export interface PromoteProject {
  project: ProjectRow;
  campaign: PromoteCampaignRow | null;
}

export async function fetchPromoteProject(projectId: string): Promise<PromoteProject | null> {
  const admin = serviceClient<Database>();
  const [{ data: project }, { data: campaign }] = await Promise.all([
    admin.from('projects').select('*').eq('id', projectId).maybeSingle(),
    admin.from('promote_campaigns').select('*').eq('project_id', projectId).maybeSingle(),
  ]);
  if (!project) return null;
  return { project, campaign: campaign ?? null };
}

export interface SubmittedShare {
  task_id: string;
  worker_id: string;
  platform: AudiencePlatform | null;
  post_url: string;
  evidence_url: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  submitted_at: string | null;
  approved_at: string | null;
}

export async function fetchPromoteShares(projectId: string, limit = 200): Promise<SubmittedShare[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('tasks')
    .select('id, assigned_to, status, response, evidence_url, submitted_at, approved_at')
    .eq('project_id', projectId)
    .in('status', ['submitted', 'approved', 'rejected'])
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  type Row = Pick<TaskRow, 'id' | 'assigned_to' | 'status' | 'response' | 'evidence_url' | 'submitted_at' | 'approved_at'>;
  return (data as Row[] | null ?? []).map((r) => {
    const payload = (r.response ?? {}) as { platform?: AudiencePlatform; post_url?: string };
    return {
      task_id: r.id,
      worker_id: r.assigned_to ?? '',
      platform: payload.platform ?? null,
      post_url: payload.post_url ?? '',
      evidence_url: r.evidence_url ?? null,
      status: r.status as 'submitted' | 'approved' | 'rejected',
      submitted_at: r.submitted_at,
      approved_at: r.approved_at,
    };
  });
}

// Worker-side: their verified audiences that match the campaign's target
// platforms AND meet min-audience requirement.
export async function fetchEligibleAudiences(
  workerId: string,
  targetPlatforms: string[],
  minAudience: number,
): Promise<WorkerAudienceRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('worker_audiences')
    .select('*')
    .eq('worker_id', workerId)
    .eq('status', 'verified')
    .in('platform', (targetPlatforms.length > 0 ? targetPlatforms : ['twitter', 'instagram', 'tiktok', 'telegram_channel', 'whatsapp_group', 'facebook', 'youtube']) as AudiencePlatform[])
    .gte('verified_follower_count', minAudience);
  return data ?? [];
}
