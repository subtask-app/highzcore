// GET /api/cron/process-notifications
//
// Drain endpoint for the new notifications table. Reads up to BATCH_SIZE
// pending rows in priority order, dispatches each, and updates status.
// Designed to be called by pg_cron (or any external cron) every ~30s.
//
// Auth: requires a Bearer token matching CRON_SECRET (if set), or
// localhost-only access in dev.

import { type NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import type { Database, NotificationRow } from '@/lib/supabase/types';
import { dispatchNotification } from '@/lib/notifications/dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const admin = serviceClient<Database>();

  const { data: pending, error: fetchErr } = await admin
    .from('notifications')
    .select('*')
    .eq('status', 'pending')
    .or('next_attempt_at.is.null,next_attempt_at.lte.' + new Date().toISOString())
    .lt('attempt_count', MAX_ATTEMPTS)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return NextResponse.json({ error: 'fetch_failed', detail: fetchErr.message }, { status: 500 });
  }

  const results = {
    picked: pending?.length ?? 0,
    sent: 0,
    failed: 0,
    by_channel: { in_app: 0, telegram: 0, telegram_channel: 0, email: 0 } as Record<string, number>,
  };

  for (const row of (pending ?? []) as NotificationRow[]) {
    const out = await dispatchNotification({
      channel: row.channel,
      template_key: row.template_key ?? '',
      template_data: row.template_data ?? {},
      email_to: row.email_to,
      telegram_chat_id: row.telegram_chat_id,
      subject: row.subject,
      body: row.body,
    });

    if (out.ok) {
      await admin
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempt_count: row.attempt_count + 1,
          last_error: null,
        })
        .eq('id', row.id);
      results.sent++;
      results.by_channel[row.channel] = (results.by_channel[row.channel] ?? 0) + 1;
    } else {
      const nextAttempts = row.attempt_count + 1;
      const isTerminal = nextAttempts >= MAX_ATTEMPTS || out.error === 'no_telegram_chat_id' || out.error === 'channel_not_configured';
      const retryDelayMin = 5 * Math.pow(2, row.attempt_count); // 5, 10, 20, 40 min
      await admin
        .from('notifications')
        .update({
          status: isTerminal ? 'failed' : 'pending',
          attempt_count: nextAttempts,
          last_error: out.error ?? 'unknown',
          next_attempt_at: isTerminal ? null : new Date(Date.now() + retryDelayMin * 60_000).toISOString(),
        })
        .eq('id', row.id);
      results.failed++;
    }
  }

  return NextResponse.json(results);
}
