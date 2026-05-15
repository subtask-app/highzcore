// Primary Google-OAuth callback for SIGN-UP and SIGN-IN.
//
// Login concerns ONLY. Does not request or store any YouTube scope/token.
// The YouTube grant lives in its own flow (api/request-youtube-access +
// auth/youtube-callback).
//
// Flow:
//   1. Exchange the `code` for a Supabase session.
//   2. The auth-user trigger (on_auth_user_created) inserted the public.users
//      row. If a role intent cookie is set we flip the matching boolean here.
//   3. Redirect to `next` (passed as a query param), defaulting to /post-login
//      which routes based on role + onboarding status.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { readRoleIntent } from '@/lib/auth/actions';
import type { Database } from '@/lib/supabase/types';

function redirectTo(url: URL): NextResponse {
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const next = reqUrl.searchParams.get('next') ?? '/post-login';
  const roleParam = reqUrl.searchParams.get('role'); // legacy compat

  if (!code) {
    return redirectTo(new URL('/login?error=missing_code', reqUrl));
  }

  // 1. Exchange code → session (sets the session cookie via SSR client).
  const supabase = await createClient();
  const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !data?.user) {
    return redirectTo(new URL(`/login?error=${encodeURIComponent(exchangeError?.message ?? 'auth_failed')}`, reqUrl));
  }
  const authUser = data.user;

  // 2. Flip the role boolean based on intent cookie or ?role= param. If the
  //    user already had the role, this is a no-op.
  const cookieIntent = await readRoleIntent();
  const desired: 'creator' | 'worker' | null =
    cookieIntent ?? (roleParam === 'creator' || roleParam === 'worker' ? roleParam : null);

  if (desired) {
    const admin = serviceClient<Database>();
    await admin
      .from('users')
      .update(desired === 'creator' ? { is_creator: true } : { is_worker: true })
      .eq('id', authUser.id);
  }

  // 3. Send them to `next`. /post-login figures out the right destination.
  return redirectTo(new URL(next, reqUrl));
}
