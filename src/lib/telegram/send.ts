// sendTelegramNotification — drain endpoint's analogue to email's sendEmail.
//
// Resolves the recipient's telegram_user_id from a Highzcore user_id, renders
// the template, and pushes the message via grammy's bot API.

import { serviceClient } from '@/lib/supabase/service';
import type {
  EmailPayload,
  EmailType,
  AnyTelegramType,
  AnyTelegramPayload,
} from '@/lib/email/types';
import { renderTelegram } from './render';
import { getBot } from './bot';

export interface SendTelegramInput<T extends EmailType> {
  recipientUserId: string | null;
  type: T;
  payload: EmailPayload<T>;
}

export interface SendTelegramResult {
  message_id: number;
  chat_id: number;
}

export async function sendTelegramNotification<T extends EmailType>(
  { recipientUserId, type, payload }: SendTelegramInput<T>,
): Promise<SendTelegramResult> {
  if (!recipientUserId) {
    throw new Error('telegram: recipient_user_id required (cannot send without a Telegram user link)');
  }

  // Look up the linked Telegram id. Cache layer would be nice but premature
  // for the volume we're at; one row per send is fine.
  const admin = serviceClient();
  const { data: row, error } = await admin
    .from('users')
    .select('telegram_user_id')
    .eq('id', recipientUserId)
    .single() as { data: { telegram_user_id: number | null } | null; error: any };

  if (error) throw new Error(`telegram: failed to load recipient (${error.message})`);
  const tgUserId = row?.telegram_user_id ?? null;
  if (!tgUserId) {
    throw new Error('telegram: recipient has no telegram_user_id linked');
  }

  // EmailType is a subset of AnyTelegramType and EmailPayload<T> equals
  // AnyTelegramPayload<T> for T ∈ EmailType, but TS can't narrow that
  // through the generic. Safe cast.
  const rendered = renderTelegram(type as never, payload as never);

  const bot = getBot();
  const res = await bot.api.sendMessage(tgUserId, rendered.text, {
    parse_mode: rendered.parse_mode,
    reply_markup: rendered.reply_markup,
    link_preview_options: rendered.disable_web_page_preview ? { is_disabled: true } : undefined,
  });

  return { message_id: res.message_id, chat_id: Number(res.chat.id) };
}

// ── Channel broadcast — single post to the configured community channel ────

export async function sendTelegramChannelBroadcast<T extends AnyTelegramType>(
  type: T,
  payload: AnyTelegramPayload<T>,
): Promise<SendTelegramResult> {
  // Channel target — accepts either an @username or a numeric chat id.
  const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME?.trim();
  const channelChatId = process.env.TELEGRAM_CHANNEL_CHAT_ID?.trim();
  const target: string | number | null =
    channelChatId ? Number(channelChatId) :
    channelUsername ? `@${channelUsername.replace(/^@/, '')}` :
    null;

  if (!target) {
    throw new Error('telegram_channel: TELEGRAM_CHANNEL_USERNAME (or TELEGRAM_CHANNEL_CHAT_ID) not configured');
  }

  const rendered = renderTelegram(type, payload);
  const bot = getBot();
  const res = await bot.api.sendMessage(target, rendered.text, {
    parse_mode: rendered.parse_mode,
    reply_markup: rendered.reply_markup,
    link_preview_options: rendered.disable_web_page_preview ? { is_disabled: true } : undefined,
  });
  return { message_id: res.message_id, chat_id: Number(res.chat.id) };
}
