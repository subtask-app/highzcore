import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, appUrl, esc, naira, openAppButton } from './_layout';
import { InlineKeyboard } from 'grammy';

export function render(p: EmailPayload<'new_contract_invoice'>): TelegramRendered {
  const lines = [
    '💼 <b>New campaign awaiting payment</b>',
    '',
    `Client: ${esc(p.client_name ?? p.client_email ?? '—')}`,
    `Channel: <b>${esc(p.channel_name)}</b>`,
    `Target: <b>${p.target_subscribers.toLocaleString()}</b> subscribers`,
    `Total: <b>${naira(p.total_amount)}</b>`,
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: new InlineKeyboard()
      .webApp('Open admin', `${appUrl()}/dashboard/admin`),
  };
}
