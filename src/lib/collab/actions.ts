'use server';

// Server actions for the Collab product. Unlike Insights/ABTest/Promote,
// collabs are creator-to-creator (no workers). State transitions:
//
//   proposed → accepted → completed
//           → declined
//
// Money flow (M9 — simplified):
//   - Both sides pay escrow_per_side; platform takes 15% × 2 = 30% combined
//   - Refund processing for declined / disputed collabs lives in the admin
//     tools milestone — for now we just mark the project as cancelled.

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type {
  CollabKind,
  Database,
} from '@/lib/supabase/types';
import {
  collabFeeBreakdown,
  MAX_ESCROW_USD,
  MIN_ESCROW_USD,
} from './pricing';

// ─── Propose a collab ─────────────────────────────────────────────────────
export async function proposeCollabAction(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const targetId = (formData.get('target_id') as string | null)?.trim();
  const kind = formData.get('kind') as CollabKind | null;
  const proposedTerms = ((formData.get('proposed_terms') as string | null) ?? '').trim();
  const deadline = (formData.get('agreed_deadline') as string | null)?.trim() || null;
  const escrowRaw = Number(formData.get('escrow_amount') ?? 0);
  const method = (formData.get('payment_method') as string | null) ?? 'admin_credit';

  if (!targetId) return { error: 'target_required' };
  if (targetId === user.id) return { error: 'cannot_self_propose' };
  if (!kind) return { error: 'kind_required' };
  if (proposedTerms.length < 10) return { error: 'terms_too_short' };
  if (!Number.isFinite(escrowRaw) || escrowRaw < MIN_ESCROW_USD || escrowRaw > MAX_ESCROW_USD) {
    return { error: 'escrow_invalid' };
  }

  const breakdown = collabFeeBreakdown(escrowRaw);
  const admin = serviceClient<Database>();

  // Verify the target exists + is a creator.
  const { data: target } = await admin
    .from('users')
    .select('id, is_creator, full_name')
    .eq('id', targetId)
    .maybeSingle();
  if (!target || !target.is_creator) return { error: 'target_not_creator' };

  // Project — total = both escrows combined; fee = sum of per-side fees.
  // worker_pool_usd is unused for collab (no tasks) so we mirror it as the
  // total minus fee for accounting.
  const totalUsd = breakdown.totalPot;
  const platformFee = breakdown.platformFee;
  const workerPool = totalUsd - platformFee;

  const projectTitle = `Collab: ${target.full_name ?? 'creator'}`;
  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      creator_id: user.id,
      type: 'collab',
      status: 'pending_payment',
      title: projectTitle,
      target_response_count: null,
      collected_response_count: 0,
      price_usd: totalUsd,
      platform_fee_usd: platformFee,
      worker_pool_usd: workerPool,
      worker_payout_per_task_usd: 0,
    })
    .select('*')
    .single();
  if (projErr || !project) return { error: projErr?.message ?? 'project_create_failed' };

  const { error: matchErr } = await admin.from('collab_matches').insert({
    project_id: project.id,
    creator_a_id: user.id,
    creator_b_id: targetId,
    kind,
    proposed_terms: proposedTerms,
    agreed_deadline: deadline,
    escrow_a_usd: escrowRaw,
    escrow_b_usd: escrowRaw,
  });
  if (matchErr) return { error: matchErr.message };

  // Creator A's escrow payment.
  const validMethod =
    method === 'flutterwave' || method === 'ccpayment' || method === 'direct_transfer'
      ? method
      : 'admin_credit';
  const { error: intentErr } = await admin
    .from('payment_intents')
    .insert({
      project_id: project.id,
      user_id: user.id,
      amount_usd: escrowRaw,
      currency_local: 'USD',
      method: validMethod,
      status: validMethod === 'admin_credit' ? 'succeeded' : 'pending',
      completed_at: validMethod === 'admin_credit' ? new Date().toISOString() : null,
    });
  if (intentErr) return { error: intentErr.message };

  // Notify creator_b that there's a proposal waiting.
  await admin.from('notifications').insert({
    user_id: targetId,
    channel: 'in_app',
    priority: 3,
    subject: `Collab proposal from ${(await getDisplayName(user.id)) ?? 'a creator'}`,
    body: `${proposedTerms.slice(0, 140)}…`,
    template_key: 'collab.proposed',
    template_data: { project_id: project.id, kind, escrow_usd: escrowRaw },
  });

  revalidatePath('/creator/collab');
  redirect(`/creator/collab/${project.id}`);
}

// ─── Accept a proposed collab ─────────────────────────────────────────────
export async function acceptCollabAction(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const projectId = (formData.get('project_id') as string | null)?.trim();
  const method = (formData.get('payment_method') as string | null) ?? 'admin_credit';
  if (!projectId) return { error: 'project_required' };

  const admin = serviceClient<Database>();
  const { data: match } = await admin
    .from('collab_matches')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (!match || match.creator_b_id !== user.id) return { error: 'not_your_proposal' };
  if (match.accepted_at) return { error: 'already_accepted' };
  if (match.declined_at) return { error: 'already_declined' };

  // Mark accepted + record B's escrow payment + flip project to active.
  await admin
    .from('collab_matches')
    .update({ accepted_at: new Date().toISOString() })
    .eq('project_id', projectId);

  const validMethod =
    method === 'flutterwave' || method === 'ccpayment' || method === 'direct_transfer'
      ? method
      : 'admin_credit';
  await admin.from('payment_intents').insert({
    project_id: projectId,
    user_id: user.id,
    amount_usd: match.escrow_b_usd,
    currency_local: 'USD',
    method: validMethod,
    status: validMethod === 'admin_credit' ? 'succeeded' : 'pending',
    completed_at: validMethod === 'admin_credit' ? new Date().toISOString() : null,
  });

  await admin
    .from('projects')
    .update({ status: 'active', launched_at: new Date().toISOString(), paid_at: new Date().toISOString() })
    .eq('id', projectId);

  // Notify A.
  await admin.from('notifications').insert({
    user_id: match.creator_a_id,
    channel: 'in_app',
    priority: 3,
    subject: `Your collab proposal was accepted`,
    body: `They paid their escrow — the collab is live.`,
    template_key: 'collab.accepted',
    template_data: { project_id: projectId },
  });

  revalidatePath('/creator/collab');
  revalidatePath(`/creator/collab/${projectId}`);
}

// ─── Decline ───────────────────────────────────────────────────────────────
export async function declineCollabAction(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const projectId = (formData.get('project_id') as string | null)?.trim();
  const reason = ((formData.get('reason') as string | null) ?? '').trim() || null;
  if (!projectId) return { error: 'project_required' };

  const admin = serviceClient<Database>();
  const { data: match } = await admin
    .from('collab_matches')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (!match || match.creator_b_id !== user.id) return { error: 'not_your_proposal' };
  if (match.accepted_at || match.declined_at) return { error: 'already_resolved' };

  await admin
    .from('collab_matches')
    .update({ declined_at: new Date().toISOString(), declined_reason: reason })
    .eq('project_id', projectId);

  await admin
    .from('projects')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_reason: reason ?? 'declined' })
    .eq('id', projectId);

  await admin.from('notifications').insert({
    user_id: match.creator_a_id,
    channel: 'in_app',
    priority: 3,
    subject: `Your collab proposal was declined`,
    body: reason ?? 'No reason given.',
    template_key: 'collab.declined',
    template_data: { project_id: projectId },
  });

  revalidatePath('/creator/collab');
  revalidatePath(`/creator/collab/${projectId}`);
}

// ─── Confirm completion (each side independently) ─────────────────────────
export async function confirmCollabComplete(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const projectId = (formData.get('project_id') as string | null)?.trim();
  if (!projectId) return { error: 'project_required' };

  const admin = serviceClient<Database>();
  const { data: match } = await admin
    .from('collab_matches')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (!match) return { error: 'match_not_found' };
  if (!match.accepted_at) return { error: 'not_yet_accepted' };

  const iAmA = match.creator_a_id === user.id;
  const iAmB = match.creator_b_id === user.id;
  if (!iAmA && !iAmB) return { error: 'not_a_party' };

  const patch = iAmA
    ? { a_confirmed_complete: true }
    : { b_confirmed_complete: true };

  await admin.from('collab_matches').update(patch).eq('project_id', projectId);

  const bothConfirmed = (iAmA ? true : match.a_confirmed_complete) && (iAmB ? true : match.b_confirmed_complete);
  if (bothConfirmed) {
    await admin
      .from('projects')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', projectId);
  }

  // Tell the counterparty.
  const counterId = iAmA ? match.creator_b_id : match.creator_a_id;
  await admin.from('notifications').insert({
    user_id: counterId,
    channel: 'in_app',
    priority: 4,
    subject: bothConfirmed ? 'Collab completed' : 'Your counterparty confirmed completion',
    body: bothConfirmed
      ? 'Both sides confirmed — the collab is done.'
      : 'They marked the collab complete. Confirm on your side too when you\'re ready.',
    template_key: 'collab.confirm',
    template_data: { project_id: projectId, both_confirmed: bothConfirmed },
  });

  revalidatePath('/creator/collab');
  revalidatePath(`/creator/collab/${projectId}`);
}

// Helper — display name lookup for notification subjects.
async function getDisplayName(userId: string): Promise<string | null> {
  const admin = serviceClient<Database>();
  const { data } = await admin.from('users').select('full_name').eq('id', userId).maybeSingle();
  return data?.full_name ?? null;
}
