import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, openAppButton } from './_layout';

export function render(p: EmailPayload<'client_no_reply_reminder'>): TelegramRendered {
  const lines = [
    '👋 <b>A friendly nudge</b>',
    '',
    `We replied about <b>${esc(p.channel_name)}</b> and haven't heard back:`,
    `<i>"${esc(p.preview)}"</i>`,
    '',
    'Whenever you\'re ready.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('Reply now', `/dashboard/client?contract=${p.contract_id}`),
  };
}
