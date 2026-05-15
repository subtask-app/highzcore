// Server queries for the admin dashboard. All service-role; the admin
// layout guard checks is_admin once and trusts thereafter.

import { serviceClient } from '@/lib/supabase/service';
import type {
  AuditLogRow,
  Database,
  LedgerEntryRow,
  PaymentIntentRow,
  ProjectRow,
  ProjectType,
  TaskRow,
  TaskStatus,
  UserRow,
  WithdrawalRow,
  WorkerAudienceRow,
  WorkerProfileRow,
} from '@/lib/supabase/types';

// ─── Overview stats ────────────────────────────────────────────────────────
export interface AdminOverview {
  users: number;
  creators: number;
  workers: number;
  projectsActive: number;
  projectsCompleted: number;
  tasksAwaitingReview: number;
  audiencesAwaitingReview: number;
  withdrawalsAwaitingProcess: number;
  platformRevenueUsd: number;
  pendingPayoutsUsd: number;
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const admin = serviceClient<Database>();

  const [
    { count: users },
    { count: creators },
    { count: workers },
    { count: projectsActive },
    { count: projectsCompleted },
    { count: tasksAwaitingReview },
    { count: audiencesAwaitingReview },
    { count: withdrawalsAwaitingProcess },
    { data: revenueRows },
    { data: pendingRows },
  ] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('is_creator', true),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('is_worker', true),
    admin.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    admin.from('worker_audiences').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('withdrawals').select('id', { count: 'exact', head: true }).in('status', ['requested', 'processing']),
    admin.from('projects').select('platform_fee_usd').in('status', ['active', 'completed']),
    admin.from('worker_profiles').select('pending_balance, earnings_balance'),
  ]);

  const platformRevenueUsd = (revenueRows ?? []).reduce(
    (s: number, r: { platform_fee_usd: number }) => s + Number(r.platform_fee_usd ?? 0),
    0,
  );
  const pendingPayoutsUsd = (pendingRows ?? []).reduce(
    (s: number, r: { pending_balance: number; earnings_balance: number }) =>
      s + Number(r.pending_balance ?? 0) + Number(r.earnings_balance ?? 0),
    0,
  );

  return {
    users: users ?? 0,
    creators: creators ?? 0,
    workers: workers ?? 0,
    projectsActive: projectsActive ?? 0,
    projectsCompleted: projectsCompleted ?? 0,
    tasksAwaitingReview: tasksAwaitingReview ?? 0,
    audiencesAwaitingReview: audiencesAwaitingReview ?? 0,
    withdrawalsAwaitingProcess: withdrawalsAwaitingProcess ?? 0,
    platformRevenueUsd,
    pendingPayoutsUsd,
  };
}

// ─── Projects list ─────────────────────────────────────────────────────────
export interface AdminProjectRow extends ProjectRow {
  creator_name: string | null;
  creator_email: string | null;
}

export async function fetchAllProjects(filters: {
  type?: ProjectType | 'all';
  status?: string;
  limit?: number;
} = {}): Promise<AdminProjectRow[]> {
  const admin = serviceClient<Database>();
  let q = admin
    .from('projects')
    .select('*, creator:users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.type && filters.type !== 'all') q = q.eq('type', filters.type);
  if (filters.status) q = q.eq('status', filters.status as ProjectRow['status']);

  type Row = ProjectRow & { creator: { full_name: string | null; email: string } | null };
  const { data } = await q;
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    ...r,
    creator_name: r.creator?.full_name ?? null,
    creator_email: r.creator?.email ?? null,
  }));
}

// ─── Task moderation queue ────────────────────────────────────────────────
export interface AdminTaskRow extends TaskRow {
  worker_name: string | null;
  worker_email: string | null;
  project_title: string | null;
  project_type: ProjectType | null;
}

export async function fetchModerationQueue(projectId?: string, limit = 100): Promise<AdminTaskRow[]> {
  const admin = serviceClient<Database>();
  let q = admin
    .from('tasks')
    .select('*, worker:users!tasks_assigned_to_fkey(full_name, email), project:projects(title, type)')
    .eq('status', 'submitted' satisfies TaskStatus)
    .order('submitted_at', { ascending: true })
    .limit(limit);
  if (projectId) q = q.eq('project_id', projectId);
  type Row = TaskRow & {
    worker: { full_name: string | null; email: string } | null;
    project: { title: string; type: ProjectType } | null;
  };
  const { data } = await q;
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    ...r,
    worker_name: r.worker?.full_name ?? null,
    worker_email: r.worker?.email ?? null,
    project_title: r.project?.title ?? null,
    project_type: r.project?.type ?? null,
  }));
}

// ─── Audience verification queue ──────────────────────────────────────────
export interface AdminAudienceRow extends WorkerAudienceRow {
  worker_name: string | null;
  worker_email: string | null;
}

export async function fetchAudienceQueue(status: 'pending' | 'verified' | 'rejected' = 'pending', limit = 100):
  Promise<AdminAudienceRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('worker_audiences')
    .select('*, worker:users!worker_audiences_worker_id_fkey(full_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(limit);
  type Row = WorkerAudienceRow & { worker: { full_name: string | null; email: string } | null };
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    ...r,
    worker_name: r.worker?.full_name ?? null,
    worker_email: r.worker?.email ?? null,
  }));
}

// ─── Workers list ─────────────────────────────────────────────────────────
export interface AdminWorkerRow {
  user: UserRow;
  profile: WorkerProfileRow | null;
}

export async function fetchAllWorkers(limit = 100): Promise<AdminWorkerRow[]> {
  const admin = serviceClient<Database>();
  const { data: users } = await admin
    .from('users')
    .select('*')
    .eq('is_worker', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!users) return [];
  const ids = users.map((u) => u.id);
  const { data: profiles } = await admin
    .from('worker_profiles')
    .select('*')
    .in('user_id', ids);
  const byId = new Map<string, WorkerProfileRow>((profiles ?? []).map((p) => [p.user_id, p]));
  return users.map((u) => ({ user: u, profile: byId.get(u.id) ?? null }));
}

export async function fetchWorker(userId: string): Promise<AdminWorkerRow | null> {
  const admin = serviceClient<Database>();
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.from('users').select('*').eq('id', userId).maybeSingle(),
    admin.from('worker_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (!user) return null;
  return { user, profile: profile ?? null };
}

export async function fetchWorkerLedger(userId: string, limit = 50): Promise<LedgerEntryRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('ledger_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchWorkerAudiences(userId: string): Promise<WorkerAudienceRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('worker_audiences')
    .select('*')
    .eq('worker_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ─── Finance ──────────────────────────────────────────────────────────────
export interface AdminFinance {
  platformRevenueUsd: number;
  totalEscrowHeldUsd: number;
  pendingWorkerBalancesUsd: number;
  availableWorkerBalancesUsd: number;
  lifetimePaidOutUsd: number;
  withdrawalsByStatus: Record<string, { count: number; amount: number }>;
  revenueByType: Record<ProjectType, number>;
}

export async function fetchAdminFinance(): Promise<AdminFinance> {
  const admin = serviceClient<Database>();
  const [
    { data: completedRevenue },
    { data: escrowRows },
    { data: workerBalances },
    { data: withdrawals },
  ] = await Promise.all([
    admin.from('projects').select('platform_fee_usd, type').in('status', ['active', 'completed']),
    admin.from('projects').select('price_usd, platform_fee_usd, status').in('status', ['active', 'pending_payment']),
    admin.from('worker_profiles').select('pending_balance, earnings_balance, lifetime_withdrawn'),
    admin.from('withdrawals').select('amount_usd, status'),
  ]);

  const platformRevenueUsd = (completedRevenue ?? []).reduce(
    (s: number, r: { platform_fee_usd: number }) => s + Number(r.platform_fee_usd ?? 0),
    0,
  );
  const totalEscrowHeldUsd = (escrowRows ?? []).reduce(
    (s: number, r: { price_usd: number; platform_fee_usd: number; status: string }) =>
      s + (r.status === 'active' ? Number(r.price_usd ?? 0) - Number(r.platform_fee_usd ?? 0) : Number(r.price_usd ?? 0)),
    0,
  );
  const pendingWorkerBalancesUsd = (workerBalances ?? []).reduce(
    (s: number, r: { pending_balance: number }) => s + Number(r.pending_balance ?? 0),
    0,
  );
  const availableWorkerBalancesUsd = (workerBalances ?? []).reduce(
    (s: number, r: { earnings_balance: number }) => s + Number(r.earnings_balance ?? 0),
    0,
  );
  const lifetimePaidOutUsd = (workerBalances ?? []).reduce(
    (s: number, r: { lifetime_withdrawn: number }) => s + Number(r.lifetime_withdrawn ?? 0),
    0,
  );

  const withdrawalsByStatus: AdminFinance['withdrawalsByStatus'] = {};
  for (const w of withdrawals ?? []) {
    const status = (w as { status: string }).status;
    const amount = Number((w as { amount_usd: number }).amount_usd ?? 0);
    if (!withdrawalsByStatus[status]) withdrawalsByStatus[status] = { count: 0, amount: 0 };
    withdrawalsByStatus[status].count++;
    withdrawalsByStatus[status].amount += amount;
  }

  const revenueByType: AdminFinance['revenueByType'] = {
    insights: 0, abtest: 0, promote: 0, collab: 0, boost: 0,
  };
  for (const r of completedRevenue ?? []) {
    const type = (r as { type: ProjectType }).type;
    revenueByType[type] += Number((r as { platform_fee_usd: number }).platform_fee_usd ?? 0);
  }

  return {
    platformRevenueUsd,
    totalEscrowHeldUsd,
    pendingWorkerBalancesUsd,
    availableWorkerBalancesUsd,
    lifetimePaidOutUsd,
    withdrawalsByStatus,
    revenueByType,
  };
}

// ─── Withdrawals queue ────────────────────────────────────────────────────
export interface AdminWithdrawalRow extends WithdrawalRow {
  worker_name: string | null;
  worker_email: string | null;
}

export async function fetchWithdrawalsQueue(status: 'requested' | 'processing' | 'completed' | 'failed' = 'requested', limit = 50):
  Promise<AdminWithdrawalRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('withdrawals')
    .select('*, worker:users!withdrawals_worker_id_fkey(full_name, email)')
    .eq('status', status)
    .order('requested_at', { ascending: true })
    .limit(limit);
  type Row = WithdrawalRow & { worker: { full_name: string | null; email: string } | null };
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    ...r,
    worker_name: r.worker?.full_name ?? null,
    worker_email: r.worker?.email ?? null,
  }));
}

// ─── Audit log ────────────────────────────────────────────────────────────
export interface AdminAuditRow extends AuditLogRow {
  actor_name: string | null;
  actor_email: string | null;
}

export async function fetchAuditLog(filters: { action?: string; limit?: number } = {}): Promise<AdminAuditRow[]> {
  const admin = serviceClient<Database>();
  let q = admin
    .from('audit_log')
    .select('*, actor:users!audit_log_actor_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 200);
  if (filters.action) q = q.eq('action', filters.action);
  type Row = AuditLogRow & { actor: { full_name: string | null; email: string } | null };
  const { data } = await q;
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    ...r,
    actor_name: r.actor?.full_name ?? null,
    actor_email: r.actor?.email ?? null,
  }));
}

// ─── Payment intents (for finance drill-down) ─────────────────────────────
export async function fetchRecentPayments(limit = 20): Promise<PaymentIntentRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('payment_intents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
