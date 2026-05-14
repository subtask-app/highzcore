// GET /api/request-youtube-access
//
// Mints a signed OAuth `state` and returns the Google authorization URL the
// client should navigate to. Workers call this from the dashboard when they
// need to grant YouTube read access for the first time.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signState } from '@/lib/oauth/state';

export const runtime = 'nodejs';

const YT_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 });
    }

    // `platform` tells the callback whether to redirect (web) or render a
    // "return to Telegram" page. Telegram users MUST run this OAuth in their
    // external browser — Google blocks its consent screen inside Telegram's
    // mobile webview (Error 403: disallowed_useragent).
    const platform = request.nextUrl.searchParams.get('platform') === 'telegram'
      ? 'telegram'
      : 'web';
    const state = signState(user.id, platform);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${request.nextUrl.origin}/auth/youtube-callback`,
      response_type: 'code',
      scope: YT_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });

    return NextResponse.json({
      oauthUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    });
  } catch (error: any) {
    console.error('request-youtube-access error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL', details: error?.message },
      { status: 500 },
    );
  }
}
