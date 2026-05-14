// POST /api/cron/send-reminders
//
// Finds messages that haven't been replied to within the threshold and
// enqueues reminder notifications (without sending them — process-emails
// drains the queue and picks the right channel per row).
//
//   * client → admin: admin gets nudged after 2 minutes of no reply
//   * admin → client: client gets nudged after 10 minutes of no reply
//
// Channel selection: if the recipient has a linked Telegram account the
// reminder goes via Telegram, else email. Same pick_channel logic the SQL
// triggers use, mirrored client-side.
//
// Each message is reminded at most once (messages.reminder_sent_at acts as
// the fuse). Designed to be called once per minute by pg_cron or external
// cron. Auth: X-Cron-Secret header must match process.env.CRON_SECRET.

import { NextResponse, type NextRequest } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StaleMessage {
  message_id: string;
  contract_id: string;
  client_email: string;
  channel_name: string;
  preview: string;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = serviceClient();

  // Tiny channel-picker — same rule as the SQL pick_channel() helper.
  async function channelFor(userId: string | null): Promise<'email' | 'telegram'> {
    if (!userId) return 'email';
    const { data } = await supabase
      .from('users')
      .select('telegram_user_id, telegram_linked_at')
      .eq('id', userId)
      .maybeSingle() as { data: { telegram_user_id: number | null; telegram_linked_at: string | null } | null };
    return data?.telegram_user_id && data?.telegram_linked_at ? 'telegram' : 'email';
  }

  // (a) Stale client → admin messages: nudge every admin.
  const { data: clientStaleRaw, error: e1 } = await supabase.rpc('stale_client_messages');
  if (e1) return NextResponse.json({ error: e1.message, stage: 'stale_client_messages' }, { status: 500 });
  const clientStale = (clientStaleRaw ?? []) as StaleMessage[];

  const { data: admins, error: e2 } = await supabase
    .from('users')
    .select('id, email, telegram_user_id, telegram_linked_at')
    .eq('role', 'admin');
  if (e2) return NextResponse.json({ error: e2.message, stage: 'admins' }, { status: 500 });

  let adminReminders = 0;
  for (const msg of clientStale) {
    for (const admin of (admins ?? []) as Array<{ id: string; email: string; telegram_user_id: number | null; telegram_linked_at: string | null }>) {
      const channel = admin.telegram_user_id && admin.telegram_linked_at ? 'telegram' : 'email';
      const { error } = await supabase.rpc('enqueue_email', {
        p_template: 'admin_no_reply_reminder',
        p_recipient_email: admin.email,
        p_recipient_id: admin.id,
        p_payload: {
          message_id: msg.message_id,
          contract_id: msg.contract_id,
          channel_name: msg.channel_name,
          preview: msg.preview,
        },
        p_dedupe_key: `reminder_admin:${msg.message_id}:${admin.id}`,
        p_channel: channel,
      });
      if (!error) adminReminders++;
    }
    // Fuse: don't ever remind for this message again.
    await supabase.from('messages').update({ reminder_sent_at: new Date().toISOString() }).eq('id', msg.message_id);
  }

  // (b) Stale admin → client messages: nudge the client.
  const { data: adminStaleRaw, error: e3 } = await supabase.rpc('stale_admin_messages');
  if (e3) return NextResponse.json({ error: e3.message, stage: 'stale_admin_messages' }, { status: 500 });
  const adminStale = (adminStaleRaw ?? []) as StaleMessage[];

  let clientReminders = 0;
  for (const msg of adminStale) {
    // Look up the client id so we can pick the right channel + ship via Telegram.
    const { data: contractRow } = await supabase
      .from('contracts')
      .select('client_id')
      .eq('id', msg.contract_id)
      .maybeSingle() as { data: { client_id: string } | null };
    const clientId = contractRow?.client_id ?? null;
    const channel = await channelFor(clientId);

    const { error } = await supabase.rpc('enqueue_email', {
      p_template: 'client_no_reply_reminder',
      p_recipient_email: msg.client_email,
      p_recipient_id: clientId,
      p_payload: {
        message_id: msg.message_id,
        contract_id: msg.contract_id,
        channel_name: msg.channel_name,
        preview: msg.preview,
      },
      p_dedupe_key: `reminder_client:${msg.message_id}`,
      p_channel: channel,
    });
    if (!error) clientReminders++;
    await supabase.from('messages').update({ reminder_sent_at: new Date().toISOString() }).eq('id', msg.message_id);
  }

  return NextResponse.json({
    admin_reminders_enqueued: adminReminders,
    client_reminders_enqueued: clientReminders,
    stale_client_messages: clientStale.length,
    stale_admin_messages: adminStale.length,
  });
}
