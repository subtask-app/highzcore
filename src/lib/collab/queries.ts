// Collab queries — directory of creators to browse, match details, my-collabs
// inbox. All use the service-role client because creator_b can't always see
// the underlying project row via RLS until they accept.

import { serviceClient } from '@/lib/supabase/service';
import type {
  CollabMatchRow,
  CreatorProfileRow,
  Database,
  ProjectRow,
  SubscriberBracket,
  UserRow,
} from '@/lib/supabase/types';

// ─── Directory: creators you might want to collab with ────────────────────
export interface DirectoryCreator {
  user: Pick<UserRow, 'id' | 'full_name' | 'avatar_url' | 'country'>;
  profile: Pick<CreatorProfileRow,
    | 'business_name'
    | 'primary_channel_url'
    | 'primary_channel_handle'
    | 'primary_channel_avatar_url'
    | 'subscriber_bracket'
    | 'channel_niche'
    | 'upload_cadence'
  >;
}

export interface DirectoryFilters {
  niche?: string;
  bracket?: string;
  excludeUserId?: string;
  limit?: number;
}

export async function fetchDirectory(filters: DirectoryFilters = {}): Promise<DirectoryCreator[]> {
  const admin = serviceClient<Database>();
  let q = admin
    .from('creator_profiles')
    .select(`
      user_id, business_name,
      primary_channel_url, primary_channel_handle, primary_channel_avatar_url,
      subscriber_bracket, channel_niche, upload_cadence, onboarded_at,
      user:users(id, full_name, avatar_url, country)
    `)
    .not('onboarded_at', 'is', null)
    .not('primary_channel_id', 'is', null);

  if (filters.niche)   q = q.eq('channel_niche', filters.niche);
  if (filters.bracket) q = q.eq('subscriber_bracket', filters.bracket as SubscriberBracket);
  if (filters.excludeUserId) q = q.neq('user_id', filters.excludeUserId);

  q = q.order('updated_at', { ascending: false }).limit(filters.limit ?? 50);

  type Row = CreatorProfileRow & {
    user: { id: string; full_name: string | null; avatar_url: string | null; country: string | null };
  };
  const { data } = await q;
  return (data as unknown as Row[] | null ?? []).map((r) => ({
    user: r.user,
    profile: {
      business_name: r.business_name,
      primary_channel_url: r.primary_channel_url,
      primary_channel_handle: r.primary_channel_handle,
      primary_channel_avatar_url: r.primary_channel_avatar_url,
      subscriber_bracket: r.subscriber_bracket,
      channel_niche: r.channel_niche,
      upload_cadence: r.upload_cadence,
    },
  }));
}

export async function fetchCreatorWithProfile(userId: string): Promise<DirectoryCreator | null> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('creator_profiles')
    .select(`
      user_id, business_name,
      primary_channel_url, primary_channel_handle, primary_channel_avatar_url,
      subscriber_bracket, channel_niche, upload_cadence,
      user:users(id, full_name, avatar_url, country)
    `)
    .eq('user_id', userId)
    .maybeSingle();
  type Row = CreatorProfileRow & {
    user: { id: string; full_name: string | null; avatar_url: string | null; country: string | null };
  };
  if (!data) return null;
  const r = data as unknown as Row;
  return {
    user: r.user,
    profile: {
      business_name: r.business_name,
      primary_channel_url: r.primary_channel_url,
      primary_channel_handle: r.primary_channel_handle,
      primary_channel_avatar_url: r.primary_channel_avatar_url,
      subscriber_bracket: r.subscriber_bracket,
      channel_niche: r.channel_niche,
      upload_cadence: r.upload_cadence,
    },
  };
}

// ─── Collab inbox / outbox ─────────────────────────────────────────────────
export interface MatchWithProject {
  match: CollabMatchRow;
  project: ProjectRow;
  /** The other party from the perspective of the caller. */
  counterparty: DirectoryCreator | null;
}

export async function fetchMyCollabs(userId: string): Promise<MatchWithProject[]> {
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('collab_matches')
    .select('*, project:projects(*)')
    .or(`creator_a_id.eq.${userId},creator_b_id.eq.${userId}`)
    .order('proposed_at', { ascending: false });
  type Row = CollabMatchRow & { project: ProjectRow };
  const rows = (data as unknown as Row[] | null ?? []);

  const counterIds = Array.from(new Set(rows.map((r) =>
    r.creator_a_id === userId ? r.creator_b_id : r.creator_a_id,
  )));
  const counterMap: Record<string, DirectoryCreator | null> = {};
  for (const id of counterIds) {
    counterMap[id] = await fetchCreatorWithProfile(id);
  }

  return rows.map((r) => ({
    match: {
      project_id: r.project_id,
      creator_a_id: r.creator_a_id,
      creator_b_id: r.creator_b_id,
      kind: r.kind,
      proposed_terms: r.proposed_terms,
      agreed_deadline: r.agreed_deadline,
      escrow_a_usd: r.escrow_a_usd,
      escrow_b_usd: r.escrow_b_usd,
      a_confirmed_complete: r.a_confirmed_complete,
      b_confirmed_complete: r.b_confirmed_complete,
      proposed_at: r.proposed_at,
      accepted_at: r.accepted_at,
      declined_at: r.declined_at,
      declined_reason: r.declined_reason,
    },
    project: r.project,
    counterparty: counterMap[r.creator_a_id === userId ? r.creator_b_id : r.creator_a_id] ?? null,
  }));
}

export async function fetchMatchById(matchId: string, viewerId: string): Promise<MatchWithProject | null> {
  // matchId is the project_id (since collab_matches uses project_id as PK)
  const admin = serviceClient<Database>();
  const { data } = await admin
    .from('collab_matches')
    .select('*, project:projects(*)')
    .eq('project_id', matchId)
    .maybeSingle();
  if (!data) return null;
  type Row = CollabMatchRow & { project: ProjectRow };
  const r = data as unknown as Row;
  if (r.creator_a_id !== viewerId && r.creator_b_id !== viewerId) return null;
  const counterId = r.creator_a_id === viewerId ? r.creator_b_id : r.creator_a_id;
  const counterparty = await fetchCreatorWithProfile(counterId);
  return {
    match: {
      project_id: r.project_id,
      creator_a_id: r.creator_a_id,
      creator_b_id: r.creator_b_id,
      kind: r.kind,
      proposed_terms: r.proposed_terms,
      agreed_deadline: r.agreed_deadline,
      escrow_a_usd: r.escrow_a_usd,
      escrow_b_usd: r.escrow_b_usd,
      a_confirmed_complete: r.a_confirmed_complete,
      b_confirmed_complete: r.b_confirmed_complete,
      proposed_at: r.proposed_at,
      accepted_at: r.accepted_at,
      declined_at: r.declined_at,
      declined_reason: r.declined_reason,
    },
    project: r.project,
    counterparty,
  };
}

export function collabState(match: CollabMatchRow): 'proposed' | 'accepted' | 'declined' | 'completed' {
  if (match.declined_at) return 'declined';
  if (match.a_confirmed_complete && match.b_confirmed_complete) return 'completed';
  if (match.accepted_at) return 'accepted';
  return 'proposed';
}
