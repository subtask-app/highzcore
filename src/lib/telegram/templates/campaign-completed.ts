import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, openAppButton } from './_layout';

export function render(p: EmailPayload<'campaign_completed'>): TelegramRendered {
  const lines = [
    '🎉 <b>Campaign complete!</b>',
    '',
    `Your campaign for <b>${esc(p.channel_name)}</b> just hit <b>${p.target_subscribers.toLocaleString()}</b> verified subscribers.`,
    '',
    'Thanks for trusting us. Ready for another?',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('📊 View report', `/dashboard/client?contract=${p.contract_id}`),
  };
}
