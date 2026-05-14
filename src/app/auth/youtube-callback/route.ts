// GET /auth/youtube-callback
//
// Receives the YouTube-grant authorization code, verifies the signed `state`,
// exchanges the code for tokens, and stores them on the user's row.
//
// Telegram users run this OAuth in their EXTERNAL browser (Google blocks its
// consent screen inside Telegram's mobile webview — Error 403:
// disallowed_useragent). So when the signed state says platform=telegram we
// can't redirect back into the dashboard — the external browser has no
// Supabase session. Instead we render a standalone "return to Telegram" page.
// The mini app is polling for `youtube_access_granted` and advances on its own.

import { NextResponse, type NextRequest } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { verifyState, type GrantPlatform } from '@/lib/oauth/state';

export const runtime = 'nodejs';

// Standalone success/failure page for the Telegram external-browser flow.
function returnToTelegramHtml(ok: boolean, reason?: string): string {
  const botUser = process.env.TELEGRAM_BOT_USERNAME ?? 'HighzcoreOfficial_bot';
  const deepLink = `https://t.me/${botUser}`;
  const title = ok ? 'YouTube connected' : 'Something went wrong';
  const body = ok
    ? 'Your YouTube account is linked. Head back to Telegram — your task is waiting and will pick up automatically.'
    : `We couldn't complete the connection (${reason ?? 'unknown error'}). Reopen Highzcore in Telegram and try again.`;
  const accent = ok ? '#22c55e' : '#f59e0b';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#020617;color:#e2e8f0;
       font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;}
  .card{max-width:380px;text-align:center;}
  .badge{width:72px;height:72px;border-radius:9999px;display:grid;place-items:center;margin:0 auto 20px;
         background:${accent}1a;border:1px solid ${accent}55;font-size:34px;}
  h1{font-size:22px;margin:0 0 10px;color:#fff;}
  p{font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 28px;}
  a.btn{display:inline-block;background:linear-gradient(135deg,#22d3ee,#2563eb);color:#fff;
        text-decoration:none;font-weight:600;padding:14px 28px;border-radius:14px;font-size:15px;}
</style></head><body>
  <div class="card">
    <div class="badge">${ok ? '✅' : '⚠️'}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a class="btn" href="${deepLink}">Return to Telegram</a>
  </div>
</body></html>`;
}

function fail(request: NextRequest, reason: string, platform: GrantPlatform = 'web'): NextResponse {
  if (platform === 'telegram') {
    return new NextResponse(returnToTelegramHtml(false, reason), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return NextResponse.redirect(
    new URL(`/dashboard/worker?youtube_error=${encodeURIComponent(reason)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const stateParam = reqUrl.searchParams.get('state');
  const oauthErr = reqUrl.searchParams.get('error');

  // Verify the signed state first so we know the platform even on failure.
  const stateCheck = verifyState(stateParam);
  const platform: GrantPlatform = stateCheck.platform ?? 'web';

  if (oauthErr) return fail(request, oauthErr, platform);
  if (!code) return fail(request, 'missing_code', platform);

  if (!stateCheck.ok || !stateCheck.uid) {
    console.error('youtube-callback bad state:', stateCheck.reason);
    return fail(request, stateCheck.reason ?? 'bad_state', platform);
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
      return fail(request, 'token_exchange_failed', platform);
    }
  } catch (err) {
    console.error('YouTube token exchange error:', err);
    return fail(request, 'token_exchange_failed', platform);
  }

  const access_token: string | undefined = tokenJson.access_token;
  const refresh_token: string | undefined = tokenJson.refresh_token;
  if (!access_token) return fail(request, 'no_access_token', platform);

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
    return fail(request, 'persist_failed', platform);
  }

  // Telegram: render the standalone success page (external browser, no
  // session to redirect into). Web: redirect straight back to the dashboard.
  if (platform === 'telegram') {
    return new NextResponse(returnToTelegramHtml(true), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return NextResponse.redirect(
    new URL('/dashboard/worker?youtube_granted=1', reqUrl),
  );
}
