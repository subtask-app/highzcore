// POST /api/verify-channel
//
// Server-side resolver for a YouTube channel URL / @handle / id. Returns the
// canonical channel id, title, avatar, and subscriber count so the onboarding
// wizard can render a "Is this you?" preview.
//
// Body: { input: string }
// 200:  { ok: true, meta: ChannelMeta }
// 422:  { ok: false, error: { code, ... } }

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveChannelMeta } from '@/lib/youtube/channel-meta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  input?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'not_authenticated' } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const input = body?.input ?? '';
  const result = await resolveChannelMeta(input);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error.code === 'not_found' ? 404 : 422 });
  }
  return NextResponse.json(result);
}
