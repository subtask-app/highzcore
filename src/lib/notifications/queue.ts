// Enqueue helpers used by server actions across the app. Writes rows into
// the `notifications` table that the cron drain processes.

import { serviceClient } from '@/lib/supabase/service';
import type {
  Database,
  NotificationChannel,
} from '@/lib/supabase/types';
import type {
  NotificationPayload,
  NotificationTemplateKey,
} from './types';

export interface EnqueueOptions<K extends NotificationTemplateKey> {
  user_id: string;
  template_key: K;
  template_data: NotificationPayload<K>;
  /** Defaults to `['in_app', 'telegram']`. Channel posts use enqueueChannel(). */
  channels?: NotificationChannel[];
  /** 0 = highest priority. Default 5. */
  priority?: number;
}

export async function enqueueNotification<K extends NotificationTemplateKey>(
  opts: EnqueueOptions<K>,
): Promise<void> {
  const channels = opts.channels ?? ['in_app', 'telegram'];
  const admin = serviceClient<Database>();

  // We also need to cache the user's telegram_chat_id at enqueue time so the
  // drain doesn't need a second lookup. Only fetch if Telegram is among the
  // channels we're enqueuing.
  let telegramChatId: number | null = null;
  let emailTo: string | null = null;
  if (channels.includes('telegram') || channels.includes('email')) {
    const { data: user } = await admin
      .from('users')
      .select('telegram_user_id, email')
      .eq('id', opts.user_id)
      .maybeSingle();
    telegramChatId = user?.telegram_user_id ?? null;
    emailTo = user?.email ?? null;
  }

  // Build the rows we're going to insert. Skip Telegram if there's no
  // chat id linked (the drain would just fail loudly for that row).
  const rows: Array<{
    user_id: string;
    channel: NotificationChannel;
    template_key: string;
    template_data: Record<string, unknown>;
    priority: number;
    telegram_chat_id?: number | null;
    email_to?: string | null;
  }> = [];
  for (const channel of channels) {
    if (channel === 'telegram' && !telegramChatId) continue;
    if (channel === 'email' && !emailTo) continue;
    rows.push({
      user_id: opts.user_id,
      channel,
      template_key: opts.template_key,
      template_data: opts.template_data as Record<string, unknown>,
      priority: opts.priority ?? 5,
      telegram_chat_id: channel === 'telegram' ? telegramChatId : null,
      email_to: channel === 'email' ? emailTo : null,
    });
  }

  if (rows.length === 0) return;
  await admin.from('notifications').insert(rows);
}

// ─── Channel post (no user_id) ────────────────────────────────────────────
export async function enqueueChannelBroadcast<K extends NotificationTemplateKey>(
  template_key: K,
  template_data: NotificationPayload<K>,
  priority = 3,
): Promise<void> {
  const admin = serviceClient<Database>();
  await admin.from('notifications').insert({
    user_id: null,
    channel: 'telegram_channel',
    template_key,
    template_data: template_data as Record<string, unknown>,
    priority,
  });
}
