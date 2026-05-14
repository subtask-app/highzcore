// POST /api/cron/process-emails
//
// Drains the `pending_emails` queue (now misnamed — it holds both email AND
// Telegram notifications since migration 0004). Forks by `channel`:
//
//   * channel='email'    → sendEmail via nodemailer
//   * channel='telegram' → sendTelegramNotification via grammy bot.api
//
// Same retry / failed-at semantics for both channels. Designed to be called
// once per minute from pg_cron (Supabase) or any external cron.
//
// Auth: X-Cron-Secret header must match process.env.CRON_SECRET.

import { NextResponse, type NextRequest } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import type { EmailType, PendingEmailRow } from '@/lib/email';
import { sendTelegramNotification, sendTelegramChannelBroadcast } from '@/lib/telegram/send';
import type { AnyTelegramType } from '@/lib/email/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

interface RowWithChannel extends PendingEmailRow {
  channel: 'email' | 'telegram' | 'telegram_channel';
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = serviceClient();

  const { data, error } = await supabase
    .from('pending_emails')
    .select('*')
    .is('sent_at', null)
    .is('failed_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as RowWithChannel[];
  let sentEmail = 0, sentTelegram = 0, sentChannel = 0, failed = 0;

  for (const row of rows) {
    try {
      if (row.channel === 'telegram') {
        await sendTelegramNotification({
          recipientUserId: row.recipient_user_id,
          type: row.template as EmailType,
          payload: row.payload as never,
        });
        sentTelegram++;
      } else if (row.channel === 'telegram_channel') {
        await sendTelegramChannelBroadcast(
          row.template as AnyTelegramType,
          row.payload as never,
        );
        sentChannel++;
      } else {
        await sendEmail({
          to: row.recipient_email,
          type: row.template as EmailType,
          payload: row.payload as never,
        });
        sentEmail++;
      }
      await supabase
        .from('pending_emails')
        .update({ sent_at: new Date().toISOString(), attempts: row.attempts + 1 })
        .eq('id', row.id);
    } catch (err: any) {
      const nextAttempts = row.attempts + 1;
      const giveUp = nextAttempts >= MAX_ATTEMPTS;
      await supabase
        .from('pending_emails')
        .update({
          attempts: nextAttempts,
          error: `${row.channel}: ${String(err?.message ?? err).slice(0, 800)}`,
          failed_at: giveUp ? new Date().toISOString() : null,
        })
        .eq('id', row.id);
      failed++;
    }
  }

  return NextResponse.json({
    picked: rows.length,
    sent_email: sentEmail,
    sent_telegram: sentTelegram,
    sent_telegram_channel: sentChannel,
    failed,
  });
}
