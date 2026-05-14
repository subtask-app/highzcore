// POST /api/verify-subscription
//
// The worker hits this after pressing "I'm done" on a task. We:
//   1. Make sure the caller is the worker who owns the claim.
//   2. Resolve the channel's YouTube id (extract from URL on first run, then cache).
//   3. Call the YouTube Data API with the worker's stored OAuth token.
//   4a. If subscribed → call self_verify_completion() (atomic wallet credit
//       + transaction log + contract progress bump + auto-complete).
//   4b. If NOT subscribed → enqueue the soft-warning email (idempotent on
//       completion id) and bump verification_attempts.
//
// Body: { contract_id: string }

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { checkIfSubscribed, extractChannelId, resolveHandleToChannelId } from '@/lib/youtube/checkSubscription';

export const runtime = 'nodejs';

interface Body {
  contract_id?: string;
}

async function resolveChannelId(
  channelUrl: string,
  apiKeyOrToken: string,
  useOAuth: boolean,
): Promise<string | null> {
  const direct = extractChannelId(channelUrl);
  if (direct?.startsWith('UC')) return direct;
  // It's a @handle or vanity — resolve via API.
  if (direct?.startsWith('@')) {
    return resolveHandleToChannelId(direct, apiKeyOrToken, useOAuth);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Body | null;
    const contractId = body?.contract_id?.trim();
    if (!contractId) {
      return NextResponse.json({ error: 'contract_id required' }, { status: 400 });
    }

    const admin = serviceClient();

    // ── Pull worker profile + YouTube token ───────────────────────────────
    const { data: profile, error: profileErr } = await admin
      .from('users')
      .select('id, role, google_token, youtube_access_granted, email')
      .eq('id', user.id)
      .single() as { data: { id: string; role: string; google_token: string | null; youtube_access_granted: boolean; email: string } | null; error: any };

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
    }
    if (profile.role !== 'worker') {
      return NextResponse.json({ error: 'workers_only' }, { status: 403 });
    }
    if (!profile.youtube_access_granted || !profile.google_token) {
      return NextResponse.json(
        { error: 'youtube_access_required', message: 'Grant YouTube access first.' },
        { status: 403 },
      );
    }

    // ── Pull contract + channel info ──────────────────────────────────────
    const { data: contract, error: cErr } = await admin
      .from('contracts')
      .select('id, channel_id, channel_url, channel_name, worker_payout_per_task, status, target_subscribers, verified_count')
      .eq('id', contractId)
      .single() as { data: { id: string; channel_id: string | null; channel_url: string; channel_name: string; worker_payout_per_task: number; status: string; target_subscribers: number; verified_count: number } | null; error: any };

    if (cErr || !contract) {
      return NextResponse.json({ error: 'contract_not_found' }, { status: 404 });
    }
    if (contract.status !== 'active') {
      return NextResponse.json({ error: 'contract_not_active', status: contract.status }, { status: 409 });
    }

    // ── Resolve & cache channel_id ────────────────────────────────────────
    let channelId = contract.channel_id;
    if (!channelId) {
      const resolved = await resolveChannelId(contract.channel_url, profile.google_token, true);
      if (!resolved) {
        return NextResponse.json(
          { error: 'channel_resolve_failed', message: 'Couldn\'t resolve the channel URL to a YouTube ID.' },
          { status: 422 },
        );
      }
      channelId = resolved;
      await admin.from('contracts').update({ channel_id: resolved }).eq('id', contractId);
    }

    // ── Ensure a completions row exists for this worker × contract ───────
    let { data: completion } = await admin
      .from('completions')
      .select('id, verified, verification_attempts, submitted_at, rejected_at')
      .eq('contract_id', contractId)
      .eq('worker_id', user.id)
      .maybeSingle() as { data: { id: string; verified: boolean; verification_attempts: number; submitted_at: string | null; rejected_at: string | null } | null };

    if (!completion) {
      const { data: inserted, error: insertErr } = await admin
        .from('completions')
        .insert({
          contract_id: contractId,
          worker_id: user.id,
          payout_amount: contract.worker_payout_per_task,
        })
        .select('id, verified, verification_attempts, submitted_at, rejected_at')
        .single() as { data: { id: string; verified: boolean; verification_attempts: number; submitted_at: string | null; rejected_at: string | null } | null; error: any };
      if (insertErr || !inserted) {
        return NextResponse.json({ error: insertErr?.message ?? 'claim_failed' }, { status: 500 });
      }
      completion = inserted;
    }

    if (completion.verified) {
      // Idempotent: already credited.
      return NextResponse.json({ verified: true, already: true, completion_id: completion.id });
    }

    // ── Rate-limit / abuse guards ─────────────────────────────────────────
    // Whatever's misbehaving (a buggy retry loop, a malicious worker spraying
    // "I'm done" hoping for a false positive) burns YouTube API quota. Two
    // cheap protections:
    //   1. 15-second cooldown between attempts on the same completion.
    //   2. Hard cap at 20 lifetime attempts per completion. Past that, the
    //      slot auto-rejects so it can be re-claimed by someone honest.
    const MAX_ATTEMPTS = 20;
    const COOLDOWN_MS = 15_000;

    if ((completion.verification_attempts ?? 0) >= MAX_ATTEMPTS) {
      // Auto-reject so the slot frees up. Engagement trigger does not double
      // pay because rejected_at is set BEFORE referrer-bonus logic.
      if (!completion.rejected_at) {
        await admin
          .from('completions')
          .update({
            rejected_at: new Date().toISOString(),
            rejection_reason: 'Exceeded maximum verification attempts.',
          })
          .eq('id', completion.id);
      }
      return NextResponse.json(
        { error: 'too_many_attempts', message: 'This task has been rejected after too many failed verifications. Pick another one.' },
        { status: 429 },
      );
    }

    if (completion.submitted_at) {
      const elapsed = Date.now() - new Date(completion.submitted_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const waitS = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: 'cooldown',
            message: `Hold on — wait ${waitS}s and try again. YouTube needs a moment to register the subscription.`,
            retry_after_seconds: waitS,
          },
          { status: 429, headers: { 'Retry-After': String(waitS) } },
        );
      }
    }

    // ── Call YouTube ──────────────────────────────────────────────────────
    let subscribed = false;
    try {
      subscribed = await checkIfSubscribed(profile.google_token, channelId);
    } catch (err: any) {
      console.error('YouTube subscription check failed:', err);
      return NextResponse.json(
        { error: 'youtube_api_error', message: err?.message ?? 'YouTube check failed' },
        { status: 502 },
      );
    }

    // Always bump the attempts counter so we have an audit trail.
    await admin
      .from('completions')
      .update({
        verification_attempts: (completion.verification_attempts ?? 0) + 1,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', completion.id);

    if (!subscribed) {
      // Enqueue the soft warning. Dedupe key is per-completion → only one
      // email per task per worker no matter how many times they retry.
      await admin.rpc('enqueue_email', {
        p_template: 'task_rejected_warning',
        p_recipient_email: profile.email,
        p_recipient_id: profile.id,
        p_payload: {
          completion_id: completion.id,
          channel_name: contract.channel_name,
          channel_url: contract.channel_url,
          reason: 'We couldn\'t see your subscription on this channel yet.',
        },
        p_dedupe_key: `rejected:${completion.id}`,
      });

      return NextResponse.json({
        verified: false,
        completion_id: completion.id,
        attempts: (completion.verification_attempts ?? 0) + 1,
      });
    }

    // ── Subscribed: atomic credit + log + counter bump ───────────────────
    const { data: rpcData, error: rpcErr } = await supabase.rpc('self_verify_completion', {
      p_completion_id: completion.id,
    });
    if (rpcErr) {
      console.error('self_verify_completion failed:', rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    return NextResponse.json({
      verified: true,
      ...(rpcData as Record<string, unknown>),
    });
  } catch (err: any) {
    console.error('verify-subscription unexpected error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: err?.message ?? 'unknown' },
      { status: 500 },
    );
  }
}
