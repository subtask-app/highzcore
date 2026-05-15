'use server';

// Server actions for the Thumbnail & Title A/B Testing product.

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type {
  AbtestKind,
  AbtestVariant,
  Database,
  TargetDemographics,
} from '@/lib/supabase/types';
import { enqueueChannelBroadcast } from '@/lib/notifications/queue';
import { feeBreakdown, tierById } from './pricing';

function readJson<T>(form: FormData, key: string): T | null {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// Validate the variants array. Variants need:
//   - At least 2, at most 4
//   - Each has a label
//   - Thumbnail tests need image_url; title tests need text
function validateVariants(kind: AbtestKind, variants: AbtestVariant[] | null): string | null {
  if (!variants || variants.length < 2 || variants.length > 4) return 'variants_count';
  for (const v of variants) {
    if (!v.id || !v.label) return 'variants_shape';
    if (kind === 'thumbnail' && (!v.image_url || v.image_url.length < 5)) return 'variants_thumbnail_url';
    if (kind === 'title' && (!v.text || v.text.trim().length < 1)) return 'variants_title_text';
  }
  return null;
}

// ─── Create an ABTest project ──────────────────────────────────────────────
export async function createAbtestProject(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const kind = (formData.get('kind') as AbtestKind | null);
  const videoUrl = (formData.get('video_url') as string | null)?.trim() ?? null;
  const videoTitle = (formData.get('video_title') as string | null)?.trim() ?? '';
  const tierId = (formData.get('tier') as string | null) ?? '';
  const tier = tierById(tierId);
  const variants = readJson<AbtestVariant[]>(formData, 'variants');
  const targeting = readJson<TargetDemographics>(formData, 'target_demographics') ?? {};
  const method = (formData.get('payment_method') as string | null) ?? 'admin_credit';
  const titleOverride = (formData.get('test_title') as string | null)?.trim() ?? '';

  if (kind !== 'thumbnail' && kind !== 'title') return { error: 'kind_required' };
  if (!tier) return { error: 'tier_required' };
  const variantErr = validateVariants(kind, variants);
  if (variantErr) return { error: variantErr };

  const breakdown = feeBreakdown(tier.totalUsd, tier.voteCount);
  const admin = serviceClient<Database>();

  // Build a human-readable project title.
  const projectTitle =
    titleOverride ||
    `${kind === 'thumbnail' ? 'Thumbnail' : 'Title'} test${videoTitle ? `: ${videoTitle.slice(0, 60)}` : ''}`;

  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      creator_id: user.id,
      type: 'abtest',
      status: 'pending_payment',
      title: projectTitle,
      video_url: videoUrl,
      target_demographics: targeting,
      target_response_count: tier.voteCount,
      collected_response_count: 0,
      price_usd: breakdown.totalUsd,
      platform_fee_usd: breakdown.platformFee,
      worker_pool_usd: breakdown.workerPool,
      worker_payout_per_task_usd: breakdown.perTask,
    })
    .select('*')
    .single();
  if (projErr || !project) return { error: projErr?.message ?? 'project_create_failed' };

  const { error: testErr } = await admin.from('abtest_tests').insert({
    project_id: project.id,
    kind,
    variants: variants!,
  });
  if (testErr) return { error: testErr.message };

  const validMethod =
    method === 'flutterwave' || method === 'ccpayment' || method === 'direct_transfer'
      ? method
      : 'admin_credit';
  const { data: intent, error: intentErr } = await admin
    .from('payment_intents')
    .insert({
      project_id: project.id,
      user_id: user.id,
      amount_usd: breakdown.totalUsd,
      currency_local: 'USD',
      method: validMethod,
      status: validMethod === 'admin_credit' ? 'succeeded' : 'pending',
      completed_at: validMethod === 'admin_credit' ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (intentErr || !intent) return { error: intentErr?.message ?? 'payment_intent_failed' };

  if (validMethod === 'admin_credit') {
    const { error: capErr } = await admin.rpc('capture_project_payment' as never, {
      p_project_id: project.id,
      p_intent_id: intent.id,
    } as never);
    if (capErr) return { error: capErr.message };
    await enqueueChannelBroadcast('channel.new_abtest', {
      project_id: project.id,
      project_title: project.title,
      per_task_usd: breakdown.perTask,
      kind,
    }).catch(() => { /* non-fatal */ });
  }

  revalidatePath('/creator');
  revalidatePath('/creator/projects');
  redirect(`/creator/projects/${project.id}`);
}

// ─── Worker — submit a vote ────────────────────────────────────────────────
export async function submitAbtestVote(
  taskId: string,
  vote: { variant_id: string; reason?: string },
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  if (!vote.variant_id) return { error: 'variant_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('submit_task' as never, {
    p_task_id: taskId,
    p_response: vote,
    p_evidence_url: null,
  } as never);
  if (error) return { error: error.message };

  revalidatePath('/worker/tasks');
  revalidatePath(`/worker/tasks/${taskId}`);
  return { ok: true };
}
