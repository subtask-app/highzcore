'use server';

// Server actions for the Audience Insights product. Wires up:
//   - Project + insights_studies row creation (drafted in 'pending_payment')
//   - Payment intent creation
//   - Mock capture for testing (admin_credit) — real payment integrations
//     (Flutterwave / CCPayment / WEMA direct) land in a dedicated payments
//     milestone
//   - Worker claim / submit / cancel calls into the SECURITY DEFINER RPCs

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type {
  Database,
  InsightQuestion,
  TargetDemographics,
} from '@/lib/supabase/types';
import { resolveVideoMeta } from '@/lib/youtube/video-meta';
import { enqueueChannelBroadcast } from '@/lib/notifications/queue';
import { DEFAULT_QUESTIONS } from './questions';
import { feeBreakdown, INSIGHTS_TIERS, tierById } from './pricing';

// ─── Helpers ───────────────────────────────────────────────────────────────
function readJson<T>(form: FormData, key: string): T | null {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Create + publish an Insights study (M6 mock-payment path) ─────────────
//
// FormData contract:
//   video_url:           string
//   video_id:            string
//   video_title:         string
//   video_duration:      number
//   tier:                'starter' | 'growth' | 'pro'
//   target_demographics: JSON string of TargetDemographics
//   questions:           JSON string of InsightQuestion[]
//   use_default_questions: 'true' | 'false'
//   payment_method:      'flutterwave' | 'ccpayment' | 'direct_transfer' | 'admin_credit'
//
// Returns { error } on validation failure; redirects to the new project on success.
//
export async function createInsightsProject(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const videoUrl = (formData.get('video_url') as string | null)?.trim();
  const videoId = (formData.get('video_id') as string | null)?.trim();
  const videoTitle = (formData.get('video_title') as string | null)?.trim();
  const videoDuration = Number(formData.get('video_duration'));
  const tierId = (formData.get('tier') as string | null) ?? '';
  const tier = tierById(tierId);
  const useDefaultQuestions = formData.get('use_default_questions') === 'true';
  const customQuestions = readJson<InsightQuestion[]>(formData, 'questions');
  const targeting = readJson<TargetDemographics>(formData, 'target_demographics') ?? {};
  const method = (formData.get('payment_method') as string | null) ?? 'admin_credit';

  if (!videoUrl || !videoId || !videoTitle) return { error: 'video_required' };
  if (!tier) return { error: 'tier_required' };
  const questions = useDefaultQuestions ? DEFAULT_QUESTIONS : customQuestions;
  if (!questions || questions.length === 0) return { error: 'questions_required' };

  const breakdown = feeBreakdown(tier.totalUsd, tier.responseCount);
  const admin = serviceClient<Database>();

  // 1. Create the project (pending_payment).
  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      creator_id: user.id,
      type: 'insights',
      status: 'pending_payment',
      title: `Insights: ${videoTitle.slice(0, 80)}`,
      video_url: videoUrl,
      video_id: videoId,
      video_duration_seconds: Number.isFinite(videoDuration) ? videoDuration : null,
      target_demographics: targeting,
      target_response_count: tier.responseCount,
      collected_response_count: 0,
      price_usd: breakdown.totalUsd,
      platform_fee_usd: breakdown.platformFee,
      worker_pool_usd: breakdown.workerPool,
      worker_payout_per_task_usd: breakdown.perTask,
    })
    .select('*')
    .single();
  if (projErr || !project) {
    return { error: projErr?.message ?? 'project_create_failed' };
  }

  // 2. Create the insights_studies detail row.
  const { error: studyErr } = await admin.from('insights_studies').insert({
    project_id: project.id,
    questions,
    use_default_questions: useDefaultQuestions,
  });
  if (studyErr) {
    return { error: studyErr.message };
  }

  // 3. Create the payment intent.
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
  if (intentErr || !intent) {
    return { error: intentErr?.message ?? 'payment_intent_failed' };
  }

  // 4. For the admin_credit path (mock payments in M6), immediately capture +
  //    spawn tasks via the SECURITY DEFINER RPC. Real-money methods will
  //    capture from webhooks in a future payments milestone.
  if (validMethod === 'admin_credit') {
    const { error: capErr } = await admin.rpc('capture_project_payment' as never, {
      p_project_id: project.id,
      p_intent_id: intent.id,
    } as never);
    if (capErr) {
      return { error: capErr.message };
    }
    // Announce the new study to the worker community channel.
    await enqueueChannelBroadcast('channel.new_insights', {
      project_id: project.id,
      project_title: project.title,
      per_task_usd: breakdown.perTask,
      target_count: tier.responseCount,
    }).catch(() => { /* non-fatal */ });
  }

  revalidatePath('/creator');
  revalidatePath('/creator/projects');
  redirect(`/creator/projects/${project.id}`);
}

// ─── Worker — claim / submit an Insights task ─────────────────────────────
export async function claimInsightsTask(taskId: string):
  Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('claim_task' as never, { p_task_id: taskId } as never);
  if (error) {
    if (error.message.includes('not available')) return { error: 'unavailable' };
    if (error.message.includes('not a worker'))  return { error: 'not_worker' };
    return { error: error.message };
  }
  revalidatePath(`/worker/tasks/${taskId}`);
  return { ok: true };
}

export async function submitInsightsTask(taskId: string, response: {
  answers: Array<{ question_id: string; value: string | number | null }>;
  watch_seconds: number;
  total_seconds: number;
}): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  // Cheap sanity check — the RPC validates ownership.
  if (!response.answers || response.answers.length === 0) {
    return { error: 'no_answers' };
  }

  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('submit_task' as never, {
    p_task_id: taskId,
    p_response: response,
    p_evidence_url: null,
  } as never);
  if (error) return { error: error.message };

  revalidatePath('/worker/tasks');
  revalidatePath(`/worker/tasks/${taskId}`);
  return { ok: true };
}

// Export the tier list for the wizard.
export async function listInsightsTiers() {
  return INSIGHTS_TIERS;
}
