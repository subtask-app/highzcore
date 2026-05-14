// Shared helpers for Telegram notification templates.
// All templates render HTML (parse_mode: 'HTML'). Only `<`, `>`, `&` need
// escaping in untrusted strings; far simpler than MarkdownV2.

import { InlineKeyboard } from 'grammy';

export interface TelegramRendered {
  text: string;
  parse_mode: 'HTML';
  reply_markup?: InlineKeyboard;
  // Telegram message length limit is 4096 chars. We aim well below.
  disable_web_page_preview?: boolean;
}

export const appUrl = (): string =>
  (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');

export function esc(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function naira(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

// Standard "Open the app" button. Optionally targets a specific path so the
// notification lands the user exactly where they need to be.
//
// Telegram REQUIRES https:// for `web_app` buttons. If the configured URL is
// http://localhost or otherwise insecure, return undefined so the caller can
// omit the keyboard entirely — Telegram rejects the whole sendMessage
// otherwise, which is a worse failure mode than a missing button.
export function openAppButton(label: string, path?: string): InlineKeyboard | undefined {
  const url = path ? `${appUrl()}${path}` : appUrl();
  if (!url.startsWith('https://')) {
    console.warn('telegram template: skipping web_app button — NEXT_PUBLIC_APP_URL is not https:', url);
    return undefined;
  }
  return new InlineKeyboard().webApp(label, url);
}
