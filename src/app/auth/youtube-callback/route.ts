// GET /auth/youtube-callback
//
// Receives the YouTube-grant authorization code, verifies the signed `state`,
// exchanges the code for tokens, and stores them on the user's row.

import { NextResponse, type NextRequest } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { verifyState } from '@/lib/oauth/state';

export const runtime = 'nodejs';

function fail(request: NextRequest, reason: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/dashboard/worker?youtube_error=${encodeURIComponent(reason)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const stateParam = reqUrl.searchParams.get('state');
  const oauthErr = reqUrl.searchParams.get('error');

  if (oauthErr) return fail(request, oauthErr);
  if (!code) return fail(request, 'missing_code');

  // Verify the signed state — this is what gates writing to a user's row.
  const stateCheck = verifyState(stateParam);
  if (!stateCheck.ok || !stateCheck.uid) {
    console.error('youtube-callback bad state:', stateCheck.reason);
    return fail(request, stateCheck.reason ?? 'bad_state');
  }
  const userId = stateCheck.uid;

  // Exchange code for tokens.
  let tokenJson: any;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${reqUrl.origin}/auth/youtube-callback`,
        grant_type: 'authorization_code',
      }),
    });
    tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('YouTube token exchange failed:', tokenJson);
      return fail(request, 'token_exchange_failed');
    }
  } catch (err) {
    console.error('YouTube token exchange error:', err);
    return fail(request, 'token_exchange_failed');
  }

  const access_token: string | undefined = tokenJson.access_token;
  const refresh_token: string | undefined = tokenJson.refresh_token;
  if (!access_token) return fail(request, 'no_access_token');

  // Persist on the user row via the service-role client (bypasses RLS).
  const admin = serviceClient();
  const { error: updateErr } = await admin
    .from('users')
    .update({
      google_token: access_token,
      google_refresh_token: refresh_token ?? null,
      youtube_access_granted: true,
      youtube_access_granted_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateErr) {
    console.error('YouTube token persist error:', updateErr);
    return fail(request, 'persist_failed');
  }

  return NextResponse.redirect(
    new URL('/dashboard/worker?youtube_granted=1', reqUrl),
  );
}
