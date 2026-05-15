// POST /api/telegram/link
//
// Called by the mini app on first paint or by the "Continue with Telegram"
// button, with `window.Telegram.WebApp.initData` as the body. We:
//   1. Verify the HMAC signature against TELEGRAM_BOT_TOKEN.
//   2. Find or create the matching public.users row (keyed by telegram_user_id).
//   3. Flip is_creator / is_worker if the caller passed an explicit `role`.
//   4. Mint a Supabase session via the admin magic-link API and persist it.
//   5. Return a redirect target — /post-login figures out the rest.
//
// Body: { initData: string, role?: 'creator' | 'worker' }

import { type NextRequest, NextResponse } from 'next/server';
import { verifyInitData } from '@/lib/telegram/verify';
import { serviceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  initData?: string;
  role?: 'creator' | 'worker';
}

function syntheticEmail(telegramId: number): string {
  // Anchored to the Telegram id so it's stable across logins.
  return `tg_${telegramId}@telegram.highzcore.tech`;
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'bot_not_configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const initData = body?.initData;
  const desiredRole: 'creator' | 'worker' = body?.role === 'creator' ? 'creator' : 'worker';
  if (!initData) {
    return NextResponse.json({ error: 'initdata_required' }, { status: 400 });
  }

  // 1. Verify the HMAC.
  let payload: ReturnType<typeof verifyInitData>;
  try {
    payload = verifyInitData(initData, token);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: 'invalid_initdata', detail: message }, { status: 401 });
  }

  const tgUser = payload.user;
  const email = syntheticEmail(tgUser.id);
  const displayName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() ||
    tgUser.username ||
    `tg_${tgUser.id}`;

  // Optional referral payload — /start ref_<uuid>.
  const startParam = payload.start_param ?? '';
  const referralUserId = startParam.startsWith('ref_') ? startParam.slice(4) : null;

  const admin = serviceClient<Database>();

  // 2. Locate or create the Highzcore user.
  let userId: string | null = null;
  {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        telegram_user_id: tgUser.id,
        telegram_username: tgUser.username,
        full_name: displayName,
        avatar_url: tgUser.photo_url,
        signup_role: desiredRole,
      },
    });

    if (createErr || !created.user) {
      // Race or pre-existing email — fall through to lookup by email.
      const { data: existing } = await admin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json(
          { error: 'create_failed', detail: createErr?.message ?? 'unknown' },
          { status: 500 },
        );
      }
      userId = existing.id;
    } else {
      userId = created.user.id;
    }

    // Validate the referral payload BEFORE inserting so we never set a
    // dangling FK.
    let validReferrerId: string | null = null;
    if (referralUserId && referralUserId !== userId) {
      const { data: ref } = await admin
        .from('users')
        .select('id')
        .eq('id', referralUserId)
        .maybeSingle();
      if (ref) validReferrerId = ref.id;
    }

    // The on_auth_user_created trigger will have created the mirror row.
    // Patch in Telegram-specific fields + role flag.
    await admin
      .from('users')
      .update({
        email,
        full_name: displayName,
        avatar_url: tgUser.photo_url ?? null,
        telegram_user_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        is_creator: desiredRole === 'creator',
        is_worker: desiredRole === 'worker',
        referred_by_user_id: validReferrerId,
      })
      .eq('id', userId);
  } else {
    // Existing user — keep Telegram fields fresh and ensure the requested
    // role flag is set (additive — never demotes the other role).
    await admin
      .from('users')
      .update({
        telegram_user_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        avatar_url: tgUser.photo_url ?? null,
        full_name: displayName,
        ...(desiredRole === 'creator' ? { is_creator: true } : { is_worker: true }),
      })
      .eq('id', userId);
  }

  // 3. Mint a Supabase session via magic-link admin endpoint.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: 'session_mint_failed', detail: linkErr?.message },
      { status: 500 },
    );
  }

  const ssr = await createClient();
  const { error: verifyErr } = await ssr.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyErr) {
    return NextResponse.json(
      { error: 'session_verify_failed', detail: verifyErr.message },
      { status: 500 },
    );
  }

  // 4. Decide where the client should land. /post-login does the real routing.
  return NextResponse.json({
    ok: true,
    user_id: userId,
    redirect: '/post-login',
  });
}
