'use server';

// Server actions for the worker dashboard. All RPC calls go through the
// service-role client; balance + status mutations happen inside Postgres
// (request_withdrawal, claim_task, etc.) so they stay atomic.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type { AudiencePlatform, Database } from '@/lib/supabase/types';

// ─── Request a withdrawal ──────────────────────────────────────────────────
export async function requestWithdrawalAction(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const amountRaw = formData.get('amount_usd');
  const address = ((formData.get('destination_address') as string | null) ?? '').trim();

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 10) {
    return { error: 'min_10' };
  }
  if (!address || address.length < 30) {
    return { error: 'invalid_address' };
  }

  // Saved-address checkbox: if the worker submitted a different address than
  // the one on their profile, persist the new one (so future withdrawals
  // pre-fill correctly).
  const saveAddress = formData.get('save_address') === 'on';
  if (saveAddress) {
    const admin = serviceClient<Database>();
    await admin
      .from('worker_profiles')
      .update({ usdt_trc20_address: address })
      .eq('user_id', user.id);
  }

  // Call the SECURITY DEFINER RPC.
  const admin = serviceClient<Database>();
  const { error } = await admin.rpc('request_withdrawal' as never, {
    p_amount: amount,
    p_address: address,
  } as never);

  if (error) {
    if (error.message.includes('insufficient')) return { error: 'insufficient_balance' };
    if (error.message.includes('minimum'))     return { error: 'min_10' };
    if (error.message.includes('address'))     return { error: 'invalid_address' };
    return { error: error.message };
  }

  revalidatePath('/worker/earnings');
  redirect('/worker/earnings');
}

// ─── Add an external audience for Promote ──────────────────────────────────
export async function addAudienceAction(formData: FormData):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const platform = formData.get('platform') as AudiencePlatform | null;
  const handle = ((formData.get('handle') as string | null) ?? '').trim();
  const profileUrl = ((formData.get('profile_url') as string | null) ?? '').trim() || null;
  const followers = Number(formData.get('verified_follower_count') ?? 0);

  if (!platform) return { error: 'platform_required' };
  if (!handle) return { error: 'handle_required' };

  const admin = serviceClient<Database>();
  const { error } = await admin.from('worker_audiences').insert({
    worker_id: user.id,
    platform,
    handle,
    profile_url: profileUrl,
    verified_follower_count: Number.isFinite(followers) && followers > 0 ? followers : null,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') return { error: 'duplicate' };
    return { error: error.message };
  }

  revalidatePath('/worker/audiences');
}

export async function deleteAudienceAction(id: string):
  Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const admin = serviceClient<Database>();
  // RLS would scope this, but we also constrain via worker_id for safety.
  await admin.from('worker_audiences').delete().eq('id', id).eq('worker_id', user.id);
  revalidatePath('/worker/audiences');
}

// ─── Update USDT address only (settings, not part of withdrawal) ───────────
export async function updateUsdtAddressAction(address: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 30) return { error: 'invalid_address' };

  const admin = serviceClient<Database>();
  await admin.from('worker_profiles').update({ usdt_trc20_address: trimmed }).eq('user_id', user.id);
  revalidatePath('/worker/earnings');
  revalidatePath('/worker/settings');
}
