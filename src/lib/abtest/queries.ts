// ABTest server queries.

import { serviceClient } from '@/lib/supabase/service';
import type {
  AbtestTestRow,
  Database,
  ProjectRow,
  TaskRow,
} from '@/lib/supabase/types';

export interface AbtestProject {
  project: ProjectRow;
  test: AbtestTestRow | null;
}

export async function fetchAbtestProject(projectId: string): Promise<AbtestProject | null> {
  const admin = serviceClient<Database>();
  const [{ data: project }, { data: test }] = await Promise.all([
    admin.from('projects').select('*').eq('id', projectId).maybeSingle(),
    admin.from('abtest_tests').select('*').eq('project_id', projectId).maybeSingle(),
  ]);
  if (!project) return null;
  return { project, test: test ?? null };
}

export interface AbtestVote {
  task_id: string;
  variant_id: string;
  reason?: string;
}

// Aggregate votes by variant id. Counts both 'submitted' and 'approved'
// since votes are low-cost — admins approve quickly.
export async function fetchAbtestVotes(projectId: string): Promise<Record<string, number>> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('tasks')
    .select('response')
    .eq('project_id', projectId)
    .in('status', ['submitted', 'approved']);
  type Row = Pick<TaskRow, 'response'>;
  const tally: Record<string, number> = {};
  for (const r of (data as Row[] | null ?? [])) {
    const payload = (r.response ?? {}) as { variant_id?: string };
    const v = payload.variant_id;
    if (!v) continue;
    tally[v] = (tally[v] ?? 0) + 1;
  }
  return tally;
}
