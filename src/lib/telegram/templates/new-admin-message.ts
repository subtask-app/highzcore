import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, openAppButton } from './_layout';

export function render(p: EmailPayload<'new_admin_message'>): TelegramRendered {
  const lines = [
    `💬 <b>New message from Highzcore</b>`,
    '',
    `About <b>${esc(p.channel_name)}</b>:`,
    `<i>"${esc(p.preview)}"</i>`,
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('💬 Reply', `/dashboard/client?contract=${p.contract_id}`),
  };
}
