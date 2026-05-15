// Server-side data fetching for the creator dashboard. Every function here
// runs in a Server Component / Route Handler — never imported into client
// code. They use the service-role client to bypass RLS where convenient
// (the calling code is already filtering by the authenticated creator id).

import { serviceClient } from '@/lib/supabase/service';
import type {
  CreatorProfileRow,
  Database,
  PaymentIntentRow,
  ProjectRow,
  ProjectStatus,
  ProjectType,
  UserRow,
} from '@/lib/supabase/types';

// ─── Context fetch — used by the creator layout for the guard ──────────────
export interface CreatorContext {
  user: UserRow;
  profile: CreatorProfileRow | null;
}

export async function fetchCreatorContext(userId: string): Promise<CreatorContext | null> {
  const admin = serviceClient<Database>();
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.from('users').select('*').eq('id', userId).maybeSingle(),
    admin.from('creator_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (!user) return null;
  return { user, profile: profile ?? null };
}

// ─── Home stats ────────────────────────────────────────────────────────────
export interface CreatorHomeStats {
  activeProjects: number;
  totalResponses: number;
  lifetimeSpendUsd: number;
  completedProjects: number;
}

export async function fetchCreatorStats(creatorId: string): Promise<CreatorHomeStats> {
  const admin = serviceClient<Database>();

  const [{ count: active }, { count: completed }, { data: responseSum }, { data: spendSum }] =
    await Promise.all([
      admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'active'),
      admin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'completed'),
      admin
        .from('projects')
        .select('collected_response_count')
        .eq('creator_id', creatorId),
      admin
        .from('projects')
        .select('price_usd')
        .eq('creator_id', creatorId)
        .not('paid_at', 'is', null),
    ]);

  const totalResponses =
    (responseSum ?? []).reduce((sum, r) => sum + Number(r.collected_response_count ?? 0), 0);
  const lifetimeSpendUsd =
    (spendSum ?? []).reduce((sum, r) => sum + Number(r.price_usd ?? 0), 0);

  return {
    activeProjects: active ?? 0,
    completedProjects: completed ?? 0,
    totalResponses,
    lifetimeSpendUsd,
  };
}

// ─── Recent projects ──────────────────────────────────────────────────────
export async function fetchRecentProjects(
  creatorId: string,
  limit = 5,
): Promise<ProjectRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('projects')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── All projects with filters ────────────────────────────────────────────
export interface ProjectListFilters {
  type?: ProjectType | 'all';
  status?: ProjectStatus | 'all';
}

export async function fetchProjects(
  creatorId: string,
  filters: ProjectListFilters = {},
): Promise<ProjectRow[]> {
  const admin = serviceClient<Database>();
  let q = admin
    .from('projects')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (filters.type && filters.type !== 'all') q = q.eq('type', filters.type);
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);

  const { data } = await q;
  return data ?? [];
}

// ─── Payment history ──────────────────────────────────────────────────────
export interface PaymentRow extends PaymentIntentRow {
  project_title: string | null;
  project_type: ProjectType | null;
}

export async function fetchPaymentHistory(creatorId: string, limit = 50): Promise<PaymentRow[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('payment_intents')
    .select('*, projects(title, type)')
    .eq('user_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  type Joined = PaymentIntentRow & { projects: { title: string; type: ProjectType } | null };
  return (data as Joined[] | null ?? []).map((p) => ({
    ...p,
    project_title: p.projects?.title ?? null,
    project_type: p.projects?.type ?? null,
  }));
}
