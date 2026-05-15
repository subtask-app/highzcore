// POST /api/verify-video — resolves a YouTube video URL/id into canonical
// metadata. Used by the Insights, ABTest, Promote, and Boost creation
// wizards for the preview step.
//
// Body: { input: string }
// 200: { ok: true, meta: VideoMeta }
// 4xx: { ok: false, error: { code, ... } }

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveVideoMeta } from '@/lib/youtube/video-meta';

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
  const result = await resolveVideoMeta(input);
  if (!result.ok) {
    const status =
      result.error.code === 'not_found' ? 404 :
      result.error.code === 'private_or_blocked' ? 403 :
      result.error.code === 'no_api_key' ? 500 :
      422;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
