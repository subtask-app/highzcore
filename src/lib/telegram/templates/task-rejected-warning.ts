import type { EmailPayload } from '@/lib/email/types';
import { type TelegramRendered, esc, openAppButton } from './_layout';

export function render(p: EmailPayload<'task_rejected_warning'>): TelegramRendered {
  const lines = [
    '⚠️ <b>A quick word about your last task</b>',
    '',
    `We couldn't see your subscription to <b>${esc(p.channel_name)}</b>.`,
    `<i>${esc(p.reason)}</i>`,
    '',
    'If you did subscribe, give YouTube a minute and try again from the task screen. ' +
    'Repeated unverified submissions can pause your withdrawals — we\'d rather not.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('🔁 Try again', `/dashboard/worker?tab=my-tasks`),
  };
}
