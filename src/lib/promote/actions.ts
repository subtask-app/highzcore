'use server';

// Server actions for the Promote product.

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type {
  AudiencePlatform,
  Database,
  TargetDemographics,
} from '@/lib/supabase/types';
import { enqueueChannelBroadcast } from '@/lib/notifications/queue';
import { feeBreakdown, tierById } from './pricing';
import { generateUtmCampaign, postUrlLooksValid } from './utm';

function readJson<T>(form: FormData, key: string): T | null {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// ─── Create a Promote campaign ────────────────────────────────────────────
export async function createPromoteProject(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const videoUrl = (formData.get('video_url') as string | null)?.trim();
  const videoId = (formData.get('video_id') as string | null)?.trim() ?? null;
  const videoTitle = (formData.get('video_title') as string | null)?.trim() ?? '';
  const tierId = (formData.get('tier') as string | null) ?? '';
  const tier = tierById(tierId);
  const targetPlatforms = readJson<string[]>(formData, 'target_platforms') ?? [];
  const targeting = readJson<TargetDemographics>(formData, 'target_demographics') ?? {};
  const minAudience = Number(formData.get('min_audience') ?? 100);
  const shareMessage = (formData.get('share_message_template') as string | null)?.trim() ?? null;
  const method = (formData.get('payment_method') as string | null) ?? 'admin_credit';

  if (!videoUrl) return { error: 'video_required' };
  if (!tier) return { error: 'tier_required' };
  if (targetPlatforms.length === 0) return { error: 'platforms_required' };
  if (!Number.isFinite(minAudience) || minAudience < 0) return { error: 'min_audience_invalid' };

  const breakdown = feeBreakdown(tier.totalUsd, tier.shareCount);
  const admin = serviceClient<Database>();

  const projectTitle = `Promote: ${videoTitle ? videoTitle.slice(0, 60) : videoUrl}`;

  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      creator_id: user.id,
      type: 'promote',
      status: 'pending_payment',
      title: projectTitle,
      video_url: videoUrl,
      video_id: videoId,
      target_demographics: targeting,
      target_response_count: tier.shareCount,
      collected_response_count: 0,
      price_usd: breakdown.totalUsd,
      platform_fee_usd: breakdown.platformFee,
      worker_pool_usd: breakdown.workerPool,
      worker_payout_per_task_usd: breakdown.perTask,
    })
    .select('*')
    .single();
  if (projErr || !project) return { error: projErr?.message ?? 'project_create_failed' };

  const utm = generateUtmCampaign();
  const { error: campaignErr } = await admin.from('promote_campaigns').insert({
    project_id: project.id,
    target_platforms: targetPlatforms,
    min_audience_per_share: Math.floor(minAudience),
    target_reach: null,
    target_clicks: null,
    share_message_template: shareMessage,
    utm_campaign: utm,
  });
  if (campaignErr) return { error: campaignErr.message };

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
    await enqueueChannelBroadcast('channel.new_promote', {
      project_id: project.id,
      project_title: project.title,
      per_task_usd: breakdown.perTask,
      platforms: targetPlatforms,
    }).catch(() => { /* non-fatal */ });
  }

  revalidatePath('/creator');
  revalidatePath('/creator/projects');
  redirect(`/creator/projects/${project.id}`);
}

// ─── Worker — submit a share ──────────────────────────────────────────────
export async function submitPromoteShare(
  taskId: string,
  submission: {
    platform: AudiencePlatform;
    audience_id: string;
    post_url: string;
    evidence_url?: string | null;
  },
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  if (!submission.platform) return { error: 'platform_required' };
  if (!submission.audience_id) return { error: 'audience_required' };
  if (!submission.post_url || !postUrlLooksValid(submission.post_url, submission.platform)) {
    return { error: 'post_url_invalid' };
  }

  const admin = serviceClient<Database>();
  // Verify the audience belongs to the worker AND is verified — last line
  // of defense against tampered form payloads.
  const { data: audience } = await admin
    .from('worker_audiences')
    .select('id, worker_id, status, platform')
    .eq('id', submission.audience_id)
    .maybeSingle();
  if (!audience || audience.worker_id !== user.id) return { error: 'audience_not_yours' };
  if (audience.status !== 'verified') return { error: 'audience_not_verified' };
  if (audience.platform !== submission.platform) return { error: 'platform_mismatch' };

  const { error } = await admin.rpc('submit_task' as never, {
    p_task_id: taskId,
    p_response: {
      platform: submission.platform,
      audience_id: submission.audience_id,
      post_url: submission.post_url,
    },
    p_evidence_url: submission.evidence_url ?? null,
  } as never);
  if (error) return { error: error.message };

  revalidatePath('/worker/tasks');
  revalidatePath(`/worker/tasks/${taskId}`);
  return { ok: true };
}
