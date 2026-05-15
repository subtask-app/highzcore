// Server queries for the Insights product (creator + worker views).

import { serviceClient } from '@/lib/supabase/service';
import type {
  Database,
  InsightQuestion,
  InsightsStudyRow,
  ProjectRow,
  TaskRow,
} from '@/lib/supabase/types';

export interface InsightsProject {
  project: ProjectRow;
  study: InsightsStudyRow | null;
}

export async function fetchInsightsProject(projectId: string): Promise<InsightsProject | null> {
  const admin = serviceClient<Database>();
  const [{ data: project }, { data: study }] = await Promise.all([
    admin.from('projects').select('*').eq('id', projectId).maybeSingle(),
    admin.from('insights_studies').select('*').eq('project_id', projectId).maybeSingle(),
  ]);
  if (!project) return null;
  return { project, study: study ?? null };
}

export interface InsightsResponseRow {
  task_id: string;
  submitted_at: string | null;
  approved_at: string | null;
  status: string;
  answers: Array<{ question_id: string; value: string | number | null }>;
  watch_seconds?: number;
  total_seconds?: number;
}

export async function fetchInsightsResponses(projectId: string, limit = 200): Promise<InsightsResponseRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('tasks')
    .select('id, status, submitted_at, approved_at, response')
    .eq('project_id', projectId)
    .in('status', ['submitted', 'approved'])
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  type Row = Pick<TaskRow, 'id' | 'status' | 'submitted_at' | 'approved_at' | 'response'>;
  return (data as Row[] | null ?? []).map((r) => {
    const payload = (r.response ?? {}) as {
      answers?: Array<{ question_id: string; value: string | number | null }>;
      watch_seconds?: number;
      total_seconds?: number;
    };
    return {
      task_id: r.id,
      status: r.status,
      submitted_at: r.submitted_at,
      approved_at: r.approved_at,
      answers: payload.answers ?? [],
      watch_seconds: payload.watch_seconds,
      total_seconds: payload.total_seconds,
    };
  });
}

// Quick aggregate for the project detail header.
export interface InsightsProgress {
  collected: number;
  target: number;
  progressPct: number;
}

export function progressFor(project: ProjectRow): InsightsProgress {
  const collected = project.collected_response_count ?? 0;
  const target = project.target_response_count ?? 0;
  return {
    collected,
    target,
    progressPct: target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0,
  };
}

// Suppress unused-import lint
void ({} as InsightQuestion);
