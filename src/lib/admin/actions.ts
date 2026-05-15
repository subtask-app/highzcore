'use server';

// Admin server actions. All assert is_admin server-side and write an
// audit-log entry alongside the mutation.

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type { AudienceStatus, Database, WorkerTier } from '@/lib/supabase/types';
import { writeAudit } from './audit';

async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };
  const admin = serviceClient<Database>();
  const { data } = await admin.from('users').select('is_admin').eq('id', user.id).maybeSingle();
  if (!data?.is_admin) return { error: 'not_admin' };
  return { id: user.id };
}

// ─── Task approve / reject — via RPCs ─────────────────────────────────────
export async function approveTaskAction(taskId: string): Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('approve_task' as never, { p_task_id: taskId } as never);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'task.approved',
    entity_type: 'task',
    entity_id: taskId,
  });

  revalidatePath('/admin');
  revalidatePath('/admin/projects');
  return { ok: true };
}

export async function rejectTaskAction(taskId: string, reason: string): Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;
  if (!reason || reason.trim().length < 3) return { error: 'reason_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('reject_task' as never, {
    p_task_id: taskId,
    p_reason: reason.trim(),
  } as never);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'task.rejected',
    entity_type: 'task',
    entity_id: taskId,
    diff: { reason: reason.trim() },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/projects');
  return { ok: true };
}

// ─── Audience verification ────────────────────────────────────────────────
export async function verifyAudienceAction(id: string, verifiedFollowers?: number):
  Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;

  const admin = serviceClient<Database>();
  const patch: { status: AudienceStatus; verified_at: string; verified_follower_count?: number } = {
    status: 'verified',
    verified_at: new Date().toISOString(),
  };
  if (verifiedFollowers !== undefined && Number.isFinite(verifiedFollowers) && verifiedFollowers >= 0) {
    patch.verified_follower_count = Math.floor(verifiedFollowers);
  }
  const { error } = await admin.from('worker_audiences').update(patch).eq('id', id);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'audience.verified',
    entity_type: 'worker_audience',
    entity_id: id,
    diff: { verified_follower_count: verifiedFollowers ?? null },
  });

  revalidatePath('/admin/workers');
  return { ok: true };
}

export async function rejectAudienceAction(id: string, reason: string):
  Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;
  if (!reason || reason.trim().length < 3) return { error: 'reason_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin
    .from('worker_audiences')
    .update({ status: 'rejected', rejected_reason: reason.trim() })
    .eq('id', id);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'audience.rejected',
    entity_type: 'worker_audience',
    entity_id: id,
    diff: { reason: reason.trim() },
  });

  revalidatePath('/admin/workers');
  return { ok: true };
}

// ─── Worker tier / score adjustments ──────────────────────────────────────
export async function adjustWorkerAction(
  userId: string,
  changes: { tier?: WorkerTier; reliability_score?: number; quality_score?: number },
): Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;

  const patch: Partial<{ tier: WorkerTier; reliability_score: number; quality_score: number }> = {};
  if (changes.tier) patch.tier = changes.tier;
  if (changes.reliability_score !== undefined) {
    if (changes.reliability_score < 0 || changes.reliability_score > 100) return { error: 'score_range' };
    patch.reliability_score = Math.round(changes.reliability_score);
  }
  if (changes.quality_score !== undefined) {
    if (changes.quality_score < 0 || changes.quality_score > 100) return { error: 'score_range' };
    patch.quality_score = Math.round(changes.quality_score);
  }
  if (Object.keys(patch).length === 0) return { error: 'no_changes' };

  const admin = serviceClient<Database>();
  const { error } = await admin.from('worker_profiles').update(patch).eq('user_id', userId);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'worker.adjusted',
    entity_type: 'worker_profile',
    entity_id: userId,
    diff: patch,
  });

  revalidatePath(`/admin/workers/${userId}`);
  return { ok: true };
}

export async function suspendUserAction(userId: string, reason: string):
  Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;
  if (me.id === userId) return { error: 'cannot_self_suspend' };
  if (!reason || reason.trim().length < 3) return { error: 'reason_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin
    .from('users')
    .update({ suspended_at: new Date().toISOString(), suspended_reason: reason.trim() })
    .eq('id', userId);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'user.suspended',
    entity_type: 'user',
    entity_id: userId,
    diff: { reason: reason.trim() },
  });

  revalidatePath(`/admin/workers/${userId}`);
  return { ok: true };
}

export async function unsuspendUserAction(userId: string):
  Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;

  const admin = serviceClient<Database>();
  const { error } = await admin
    .from('users')
    .update({ suspended_at: null, suspended_reason: null })
    .eq('id', userId);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'user.unsuspended',
    entity_type: 'user',
    entity_id: userId,
  });

  revalidatePath(`/admin/workers/${userId}`);
  return { ok: true };
}

// ─── Withdrawal processing ────────────────────────────────────────────────
export async function markWithdrawalProcessingAction(id: string): Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;

  const admin = serviceClient<Database>();
  const { error } = await admin
    .from('withdrawals')
    .update({ status: 'processing', processed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'requested');
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'withdrawal.processing',
    entity_type: 'withdrawal',
    entity_id: id,
  });
  revalidatePath('/admin/finance');
  return { ok: true };
}

export async function finalizeWithdrawalAction(
  id: string,
  txHash: string,
  providerRef?: string,
): Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;
  if (!txHash || txHash.length < 10) return { error: 'tx_hash_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('finalize_withdrawal' as never, {
    p_id: id,
    p_tx_hash: txHash,
    p_provider_ref: providerRef ?? null,
  } as never);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'withdrawal.completed',
    entity_type: 'withdrawal',
    entity_id: id,
    diff: { tx_hash: txHash, provider_ref: providerRef ?? null },
  });
  revalidatePath('/admin/finance');
  return { ok: true };
}

export async function failWithdrawalAction(id: string, reason: string):
  Promise<{ error: string } | { ok: true }> {
  const me = await requireAdmin();
  if ('error' in me) return me;
  if (!reason || reason.trim().length < 3) return { error: 'reason_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('fail_withdrawal' as never, {
    p_id: id,
    p_reason: reason.trim(),
  } as never);
  if (error) return { error: error.message };

  await writeAudit({
    actor_user_id: me.id,
    action: 'withdrawal.failed',
    entity_type: 'withdrawal',
    entity_id: id,
    diff: { reason: reason.trim() },
  });
  revalidatePath('/admin/finance');
  return { ok: true };
}
