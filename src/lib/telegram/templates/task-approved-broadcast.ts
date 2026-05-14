import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, naira, openAppButton } from './_layout';

export function render(p: EmailPayload<'task_approved_broadcast'>): TelegramRendered {
  const remaining = Math.max(p.target_subscribers - p.verified_count, 0);
  const lines = [
    '🎯 <b>New task available</b>',
    '',
    `<b>${esc(p.channel_name)}</b>`,
    `Payout: <b>${naira(p.payout)}</b>`,
    `Slots left: <b>${remaining.toLocaleString()}</b> / ${p.target_subscribers.toLocaleString()}`,
    '',
    'First-come, first-served.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('🚀 Open task', `/dashboard/worker?tab=available-tasks`),
  };
}
