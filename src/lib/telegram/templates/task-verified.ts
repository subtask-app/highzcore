import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, naira, openAppButton } from './_layout';

export function render(p: EmailPayload<'task_verified'>): TelegramRendered {
  const lines = [
    `✅ <b>Task approved — ${naira(p.payout_amount)} credited</b>`,
    '',
    `Your subscription to <b>${esc(p.channel_name)}</b> was verified.`,
    '',
    'Nice work. Find another task whenever you\'re ready.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('💰 View wallet', `/dashboard/worker?tab=withdrawals`),
  };
}
