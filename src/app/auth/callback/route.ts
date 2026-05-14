// Primary Google-OAuth callback for SIGN-UP and SIGN-IN.
//
// Login concerns ONLY. Does not request or store any YouTube scope/token.
// The YouTube grant lives in its own flow (api/request-youtube-access +
// auth/youtube-callback).
//
// Flow:
//   1. Exchange the `code` for a Supabase session.
//   2. If this is a brand-new user, create their `public.users` row with the
//      role taken from the `?role=` query param (allow-list: client | worker).
//   3. Redirect to the role-specific dashboard.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

type SignupRole = 'client' | 'worker';
const ALLOWED_SIGNUP_ROLES: ReadonlyArray<SignupRole> = ['client', 'worker'];

function dashboardPathFor(role: 'client' | 'worker' | 'admin'): string {
  return role === 'admin' ? '/dashboard/admin'
       : role === 'client' ? '/dashboard/client'
       : '/dashboard/worker';
}

function redirect(url: URL): NextResponse {
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const roleParam = reqUrl.searchParams.get('role');

  if (!code) {
    return redirect(new URL('/?error=missing_code', reqUrl));
  }

  // Step 1 — exchange code for session (Supabase SSR sets the session cookie).
  const supabase = await createClient();
  const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !data?.user) {
    console.error('Auth callback exchange error:', exchangeError);
    return redirect(new URL(`/?error=${encodeURIComponent(exchangeError?.message ?? 'auth_failed')}`, reqUrl));
  }
  const authUser = data.user;

  // Step 2 — does the public.users row exist?
  const { data: existing } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existing?.role) {
    return redirect(new URL(dashboardPathFor(existing.role as 'client' | 'worker' | 'admin'), reqUrl));
  }

  // Step 3 — first-time user. Determine cohort.
  const requestedRole = (roleParam as SignupRole | null);
  const cohort: SignupRole = ALLOWED_SIGNUP_ROLES.includes(requestedRole as SignupRole)
    ? (requestedRole as SignupRole)
    : 'worker'; // default cohort if signup came from /login/* with no role hint

  // Step 4 — provision the user via the service-role client so it bypasses RLS.
  // NOTE: we do NOT write google_token / google_refresh_token here. Those are
  // populated only by the YouTube-grant flow.
  const meta = (authUser.user_metadata ?? {}) as Record<string, string | undefined>;
  const admin = serviceClient();
  const { error: insertError } = await admin.from('users').insert({
    id: authUser.id,
    email: authUser.email,
    role: cohort,
    google_id: meta.sub ?? null,
    full_name: meta.full_name ?? meta.name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  });

  if (insertError) {
    // Race: the row may have been created by a parallel callback. Re-fetch.
    if (insertError.code === '23505') {
      const { data: again } = await admin
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();
      if (again?.role) {
        return redirect(new URL(dashboardPathFor(again.role as 'client' | 'worker' | 'admin'), reqUrl));
      }
    }
    console.error('Auth callback insert error:', insertError);
    return redirect(new URL(`/?error=${encodeURIComponent('account_create_failed')}`, reqUrl));
  }

  return redirect(new URL(dashboardPathFor(cohort), reqUrl));
}
