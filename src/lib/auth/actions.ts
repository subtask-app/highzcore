'use server';

// Server actions for auth + onboarding. Pages call these directly; the
// browser Supabase client handles password/OAuth signup but profile rows +
// role-flag flips happen here so RLS + service-role privileges live on the
// server side.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type {
  Database,
  Gender,
  SubscriberBracket,
  UploadCadence,
  WorkerProfileInsert,
} from '@/lib/supabase/types';

// ── Constants ──────────────────────────────────────────────────────────────
export type RoleIntent = 'creator' | 'worker';
const ROLE_COOKIE = 'hc-role-intent';
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h survives OAuth + email-verify roundtrips

// ── Role intent: small server cookie that survives Google OAuth / email-verify ──
export async function setRoleIntent(role: RoleIntent) {
  const jar = await cookies();
  jar.set(ROLE_COOKIE, role, {
    httpOnly: false,        // accessible to OAuth callback redirect URL builder
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: ROLE_COOKIE_MAX_AGE,
  });
}

export async function readRoleIntent(): Promise<RoleIntent | null> {
  const jar = await cookies();
  const v = jar.get(ROLE_COOKIE)?.value;
  return v === 'creator' || v === 'worker' ? v : null;
}

export async function clearRoleIntent() {
  const jar = await cookies();
  jar.delete(ROLE_COOKIE);
}

// ── Sign out ──────────────────────────────────────────────────────────────
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ── Add a role to an existing account ─────────────────────────────────────
// Use from settings: a creator can become a worker and vice versa. Doesn't
// touch the role they already have.
export async function addRoleAction(role: RoleIntent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = serviceClient<Database>();
  await admin
    .from('users')
    .update(role === 'creator' ? { is_creator: true } : { is_worker: true })
    .eq('id', user.id);

  redirect(`/onboarding/${role}`);
}

// ── Complete creator onboarding ───────────────────────────────────────────
export async function completeCreatorOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'not_authenticated' as const };
  }

  const businessName = (formData.get('business_name') as string | null)?.trim() || null;
  const channelUrl = (formData.get('channel_url') as string | null)?.trim() || null;
  const channelId = (formData.get('channel_id') as string | null) || null;
  const channelHandle = (formData.get('channel_handle') as string | null) || null;
  const channelAvatarUrl = (formData.get('channel_avatar_url') as string | null) || null;
  const subscriberBracket = (formData.get('subscriber_bracket') as SubscriberBracket | null) || null;
  const channelNiche = (formData.get('channel_niche') as string | null)?.trim() || null;
  const uploadCadence = (formData.get('upload_cadence') as UploadCadence | null) || null;
  const growthGoals = formData.getAll('growth_goals').filter(Boolean) as string[];
  const howDidYouHear = (formData.get('how_did_you_hear') as string | null)?.trim() || null;
  const country = (formData.get('country') as string | null) || null;
  const fullName = (formData.get('full_name') as string | null)?.trim() || null;
  const phone = (formData.get('phone') as string | null)?.trim() || null;

  if (!channelUrl) {
    return { error: 'channel_required' as const };
  }

  const admin = serviceClient<Database>();

  // Flip is_creator and patch the users row with profile-shared fields.
  await admin
    .from('users')
    .update({
      is_creator: true,
      full_name: fullName ?? undefined,
      phone: phone ?? undefined,
      country: country ?? undefined,
    })
    .eq('id', user.id);

  // Upsert the creator profile.
  const verifiedAt = channelId ? new Date().toISOString() : null;
  await admin.from('creator_profiles').upsert(
    {
      user_id: user.id,
      business_name: businessName,
      primary_channel_url: channelUrl,
      primary_channel_id: channelId,
      primary_channel_handle: channelHandle,
      primary_channel_avatar_url: channelAvatarUrl,
      primary_channel_verified_at: verifiedAt,
      subscriber_bracket: subscriberBracket,
      channel_niche: channelNiche,
      upload_cadence: uploadCadence,
      growth_goals: growthGoals,
      how_did_you_hear: howDidYouHear,
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  await clearRoleIntent();
  revalidatePath('/creator');
  redirect('/creator');
}

// ── Complete worker onboarding ────────────────────────────────────────────
export async function completeWorkerOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'not_authenticated' as const };
  }

  const stateRegion = (formData.get('state_region') as string | null)?.trim() || null;
  const city = (formData.get('city') as string | null)?.trim() || null;
  const dateOfBirth = (formData.get('date_of_birth') as string | null) || null;
  const gender = (formData.get('gender') as Gender | null) || null;
  const languages = formData.getAll('languages').filter(Boolean) as string[];
  const niches = formData.getAll('niches').filter(Boolean) as string[];
  const devices = formData.getAll('devices').filter(Boolean) as string[];
  const hours = formData.get('hours_per_day_available');
  const hoursPerDay = hours ? Number(hours) : null;
  const shortBio = (formData.get('short_bio') as string | null)?.trim() || null;
  const country = (formData.get('country') as string | null) || null;
  const fullName = (formData.get('full_name') as string | null)?.trim() || null;
  const phone = (formData.get('phone') as string | null)?.trim() || null;

  // Hard requirements: country + DOB + ≥1 language + ≥1 niche.
  if (!country) return { error: 'country_required' as const };
  if (!dateOfBirth) return { error: 'dob_required' as const };
  if (languages.length === 0) return { error: 'languages_required' as const };
  if (niches.length === 0) return { error: 'niches_required' as const };

  // 18+ check.
  const dob = new Date(dateOfBirth);
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  if (dob > eighteenYearsAgo) {
    return { error: 'must_be_18' as const };
  }

  const admin = serviceClient<Database>();

  await admin
    .from('users')
    .update({
      is_worker: true,
      full_name: fullName ?? undefined,
      phone: phone ?? undefined,
      country,
    })
    .eq('id', user.id);

  const insert: WorkerProfileInsert = {
    user_id: user.id,
    state_region: stateRegion,
    city,
    date_of_birth: dateOfBirth,
    gender,
    languages,
    niches,
    devices,
    hours_per_day_available: hoursPerDay,
    short_bio: shortBio,
    onboarded_at: new Date().toISOString(),
  };

  await admin.from('worker_profiles').upsert(insert, { onConflict: 'user_id' });

  await clearRoleIntent();
  revalidatePath('/worker');
  redirect('/worker');
}

// ── Update preferred locale (called from language switcher) ────────────────
export async function setPreferredLocale(locale: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const admin = serviceClient<Database>();
  await admin.from('users').update({ preferred_locale: locale }).eq('id', user.id);
}
