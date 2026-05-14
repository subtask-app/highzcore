import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, openAppButton } from './_layout';

export function render(p: EmailPayload<'admin_no_reply_reminder'>): TelegramRendered {
  const lines = [
    '⏰ <b>A client is waiting on you</b>',
    '',
    `About <b>${esc(p.channel_name)}</b>:`,
    `<i>"${esc(p.preview)}"</i>`,
    '',
    'It\'s been more than 2 minutes — a quick reply keeps trust high.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('Open conversation', `/dashboard/admin?contract=${p.contract_id}`),
  };
}
