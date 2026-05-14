// GET /api/leaderboard?window=week|month|today|all&limit=10
//
// Returns the top earners in the chosen window. Public-safe shape — first
// name + telegram username + avatar + total earned. No emails, no wallet
// balances. Anyone authenticated can read it.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Win = 'today' | 'week' | 'month' | 'all';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const winParam = (url.searchParams.get('window') ?? 'week').toLowerCase();
  const window: Win = (['today', 'week', 'month', 'all'] as const).includes(winParam as Win)
    ? (winParam as Win)
    : 'week';
  const limitRaw = Number(url.searchParams.get('limit') ?? '10');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.floor(limitRaw))) : 10;

  const { data, error } = await supabase.rpc('leaderboard_top', {
    p_window: window,
    p_limit: limit,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ window, entries: data ?? [] });
}
