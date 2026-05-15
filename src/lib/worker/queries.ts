// Server-side data fetching for the worker dashboard. Same conventions as
// creator/queries.ts: server-only, service-role client, callers filter by
// the authenticated worker id.

import { serviceClient } from '@/lib/supabase/service';
import type {
  Database,
  LedgerEntryRow,
  ProjectRow,
  TaskRow,
  TaskStatus,
  UserRow,
  WithdrawalRow,
  WorkerAudienceRow,
  WorkerProfileRow,
} from '@/lib/supabase/types';

// ─── Context bundle ────────────────────────────────────────────────────────
export interface WorkerContext {
  user: UserRow;
  profile: WorkerProfileRow | null;
}

export async function fetchWorkerContext(userId: string): Promise<WorkerContext | null> {
  const admin = serviceClient<Database>();
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.from('users').select('*').eq('id', userId).maybeSingle(),
    admin.from('worker_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (!user) return null;
  return { user, profile: profile ?? null };
}

// ─── Home stats ────────────────────────────────────────────────────────────
export interface WorkerHomeStats {
  earningsBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  tasksCompletedTotal: number;
  tasksToday: number;
}

export async function fetchWorkerStats(workerId: string, profile: WorkerProfileRow | null): Promise<WorkerHomeStats> {
  const admin = serviceClient<Database>();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ count: completedTotal }, { count: completedToday }] = await Promise.all([
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', workerId)
      .eq('status', 'approved'),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', workerId)
      .eq('status', 'approved')
      .gte('approved_at', startOfDay.toISOString()),
  ]);

  return {
    earningsBalance: Number(profile?.earnings_balance ?? 0),
    pendingBalance:  Number(profile?.pending_balance ?? 0),
    lifetimeEarned:  Number(profile?.lifetime_earned ?? 0),
    tasksCompletedTotal: completedTotal ?? 0,
    tasksToday: completedToday ?? 0,
  };
}

// ─── Tasks: available + mine ──────────────────────────────────────────────
export interface TaskWithProject extends TaskRow {
  project: Pick<ProjectRow, 'id' | 'title' | 'type' | 'video_url' | 'status'> | null;
}

export async function fetchAvailableTasks(workerProfile: WorkerProfileRow, limit = 30): Promise<TaskWithProject[]> {
  const admin = serviceClient<Database>();
  // Available + not assigned + (in the worker's niches OR niches not set).
  // For matching, we OR the worker's niches into a tag check on projects.target_demographics
  // is server-side overkill at this point — keep it broad now; sharpen in M6+.
  const { data } = await admin
    .from('tasks')
    .select('*, project:projects(id, title, type, video_url, status)')
    .eq('status', 'available')
    .is('assigned_to', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  // Filter out tasks for projects that are not active (paranoia — the RPC
  // would normally cap this, but the data path goes through .select()).
  type Joined = TaskRow & { project: TaskWithProject['project'] };
  const rows = (data as Joined[] | null ?? []).filter((t) => t.project?.status === 'active');
  // Soft-prefer tasks whose project type might match a niche the worker
  // listed. This is intentionally simple — proper matching ships in M10.
  void workerProfile;
  return rows;
}

export async function fetchMyTasks(workerId: string, limit = 30): Promise<TaskWithProject[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('tasks')
    .select('*, project:projects(id, title, type, video_url, status)')
    .eq('assigned_to', workerId)
    .in('status', ['claimed', 'submitted', 'approved', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(limit);
  type Joined = TaskRow & { project: TaskWithProject['project'] };
  return (data as Joined[] | null ?? []) as TaskWithProject[];
}

export async function fetchTaskWithProject(taskId: string): Promise<TaskWithProject | null> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('tasks')
    .select('*, project:projects(id, title, type, video_url, status)')
    .eq('id', taskId)
    .maybeSingle();
  return (data as TaskWithProject | null) ?? null;
}

// ─── Earnings: ledger + withdrawals ───────────────────────────────────────
export async function fetchLedger(workerId: string, limit = 50): Promise<LedgerEntryRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('ledger_entries')
    .select('*')
    .eq('user_id', workerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchWithdrawals(workerId: string, limit = 20): Promise<WithdrawalRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('withdrawals')
    .select('*')
    .eq('worker_id', workerId)
    .order('requested_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── Audiences ────────────────────────────────────────────────────────────
export async function fetchAudiences(workerId: string): Promise<WorkerAudienceRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('worker_audiences')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ─── Task counts for tier page ────────────────────────────────────────────
export interface WorkerTierStats {
  approved: number;
  rejected: number;
  completionRate: number; // 0..1
}

export async function fetchTierStats(workerId: string): Promise<WorkerTierStats> {
  const admin = serviceClient<Database>();
  const [{ count: approved }, { count: rejected }, { count: total }] = await Promise.all([
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', workerId)
      .eq('status', 'approved' satisfies TaskStatus),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', workerId)
      .eq('status', 'rejected' satisfies TaskStatus),
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', workerId)
      .in('status', ['approved' satisfies TaskStatus, 'rejected' satisfies TaskStatus]),
  ]);
  const t = total ?? 0;
  return {
    approved: approved ?? 0,
    rejected: rejected ?? 0,
    completionRate: t > 0 ? (approved ?? 0) / t : 1,
  };
}

