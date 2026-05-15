// Dispatches a single pending notification row through its channel.
// Returns ok or error; the cron handler updates the row's status afterward.

import { getBot } from '@/lib/telegram/bot';
import { renderNotification } from './templates';
import type { NotificationPayload, NotificationTemplateKey } from './types';

export interface DispatchInput {
  channel: 'in_app' | 'email' | 'telegram' | 'telegram_channel';
  template_key: string;
  template_data: Record<string, unknown>;
  email_to: string | null;
  telegram_chat_id: number | null;
  // Ad-hoc fallback when template_key isn't set:
  subject: string | null;
  body: string | null;
}

export interface DispatchResult {
  ok: boolean;
  error?: string;
}

export async function dispatchNotification(input: DispatchInput): Promise<DispatchResult> {
  const rendered = input.template_key
    ? renderNotification(
        input.template_key as NotificationTemplateKey,
        input.template_data as NotificationPayload<NotificationTemplateKey>,
      )
    : {
        text: `<b>${escapeHtml(input.subject ?? '')}</b>${input.body ? `\n\n${escapeHtml(input.body)}` : ''}`,
        reply_markup: undefined as undefined,
      };

  if (input.channel === 'in_app') {
    // In-app delivery doesn't need a network send — the notification row
    // itself IS the in-app message (read by the worker/creator dashboards
    // from the notifications table). Just mark it sent.
    return { ok: true };
  }

  if (input.channel === 'telegram') {
    if (!input.telegram_chat_id) {
      return { ok: false, error: 'no_telegram_chat_id' };
    }
    try {
      const bot = getBot();
      await bot.api.sendMessage(input.telegram_chat_id, rendered.text, {
        parse_mode: 'HTML',
        reply_markup: rendered.reply_markup,
        link_preview_options: { is_disabled: true },
      });
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : 'telegram_failed' };
    }
  }

  if (input.channel === 'telegram_channel') {
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME?.trim();
    const channelChatId = process.env.TELEGRAM_CHANNEL_CHAT_ID?.trim();
    const target =
      channelChatId ? Number(channelChatId) :
      channelUsername ? `@${channelUsername.replace(/^@/, '')}` :
      null;
    if (target === null) return { ok: false, error: 'channel_not_configured' };
    try {
      const bot = getBot();
      await bot.api.sendMessage(target, rendered.text, {
        parse_mode: 'HTML',
        reply_markup: rendered.reply_markup,
        link_preview_options: { is_disabled: true },
      });
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : 'telegram_channel_failed' };
    }
  }

  if (input.channel === 'email') {
    // Email delivery uses the existing nodemailer transport; for M11 we
    // stub it out (returns ok=false 'email_unwired') so the row goes to
    // failed state and the admin can investigate. Real email integration
    // is a follow-up milestone.
    return { ok: false, error: 'email_unwired' };
  }

  return { ok: false, error: 'unknown_channel' };
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
