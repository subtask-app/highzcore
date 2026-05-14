// POST /api/telegram/link
//
// Called by the mini app on first paint, with `window.Telegram.WebApp.initData`
// as the body. We:
//   1. Verify the HMAC signature against TELEGRAM_BOT_TOKEN.
//   2. Find or create a Highzcore user keyed by the Telegram user_id.
//   3. Mint a Supabase session via the magic-link admin API and pass it back.
//   4. Set auth cookies via the SSR client.
//
// Body: { initData: string, role?: 'client' | 'worker' }

import { type NextRequest, NextResponse } from 'next/server';
import { verifyInitData } from '@/lib/telegram/verify';
import { serviceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  initData?: string;
  role?: 'client' | 'worker';
}

function syntheticEmail(telegramId: number): string {
  // Anchored to the Telegram id so it's stable across logins. Users with a
  // real email later can rebind from the dashboard.
  return `tg_${telegramId}@telegram.highzcore.tech`;
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'bot_not_configured' }, { status: 500 });

  const body = (await request.json().catch(() => null)) as Body | null;
  const initData = body?.initData;
  const desiredRole = body?.role === 'client' ? 'client' : 'worker';
  if (!initData) return NextResponse.json({ error: 'initdata_required' }, { status: 400 });

  // 1. Verify
  let payload;
  try {
    payload = verifyInitData(initData, token);
  } catch (err: any) {
    return NextResponse.json({ error: 'invalid_initdata', detail: err.message }, { status: 401 });
  }
  const tgUser = payload.user;
  const email = syntheticEmail(tgUser.id);
  const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || tgUser.username || `tg_${tgUser.id}`;

  // Optional referral payload from /start ref_<userId>.
  // Format: "ref_<uuid>". Anything else is ignored.
  const startParam = payload.start_param ?? '';
  const referralUserId =
    startParam.startsWith('ref_') ? startParam.slice(4) : null;

  const admin = serviceClient();

  // 2. Find existing Highzcore user (either by telegram_user_id OR by synthetic email).
  let userId: string | null = null;
  {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle() as { data: { id: string } | null };
    userId = data?.id ?? null;
  }

  // 3. If not found, create the auth user + the public.users row.
  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        telegram_user_id: tgUser.id,
        telegram_username: tgUser.username,
        full_name: displayName,
        avatar_url: tgUser.photo_url,
      },
    });
    if (createErr || !created.user) {
      // If the email already exists (race / re-link), fall through to lookup.
      const { data: existing } = await admin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle() as { data: { id: string } | null };
      if (!existing) {
        return NextResponse.json({ error: 'create_failed', detail: createErr?.message ?? 'unknown' }, { status: 500 });
      }
      userId = existing.id;
    } else {
      userId = created.user.id;

      // Validate the referral payload BEFORE inserting (prevents self-referral
      // and dangling fkeys if the user spoofed an id).
      let validReferrerId: string | null = null;
      if (referralUserId && referralUserId !== userId) {
        const { data: ref } = await admin
          .from('users')
          .select('id')
          .eq('id', referralUserId)
          .maybeSingle() as { data: { id: string } | null };
        if (ref) validReferrerId = ref.id;
      }

      // Insert the public.users mirror row.
      await admin.from('users').insert({
        id: userId,
        email,
        role: desiredRole,
        full_name: displayName,
        avatar_url: tgUser.photo_url ?? null,
        telegram_user_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        telegram_photo_url: tgUser.photo_url ?? null,
        telegram_linked_at: new Date().toISOString(),
        referred_by_user_id: validReferrerId,
      });
    }
  }

  // 4. Keep the Telegram fields fresh in case they renamed themselves.
  await admin
    .from('users')
    .update({
      telegram_user_id: tgUser.id,
      telegram_username: tgUser.username ?? null,
      telegram_photo_url: tgUser.photo_url ?? null,
      avatar_url: tgUser.photo_url ?? null,
      full_name: displayName,
      telegram_linked_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // 5. Mint a fresh Supabase session via the magic-link admin endpoint, then
  //    convert it into a cookie session on the SSR client.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'session_mint_failed', detail: linkErr?.message }, { status: 500 });
  }

  const ssr = await createClient();
  const { error: verifyErr } = await ssr.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyErr) {
    return NextResponse.json({ error: 'session_verify_failed', detail: verifyErr.message }, { status: 500 });
  }

  // 6. Read role for routing decision client-side.
  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single() as { data: { role: 'client' | 'worker' | 'admin' } | null };

  return NextResponse.json({
    ok: true,
    user_id: userId,
    role: profile?.role ?? desiredRole,
    redirect:
      profile?.role === 'admin' ? '/dashboard/admin'
      : profile?.role === 'client' ? '/dashboard/client'
      : '/dashboard/worker',
  });
}
