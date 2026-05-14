import type { TelegramOnlyPayloads } from '@/lib/email/types';
import { type TelegramRendered, esc, naira, openAppButton } from './_layout';

// Posted ONCE to the Telegram community channel each time a contract goes
// active. The Mini-App deep-link gets people who aren't yet workers to
// install/sign up; existing workers tap and start the task immediately.

export function render(p: TelegramOnlyPayloads['community_announcement']): TelegramRendered {
  const lines = [
    '🎯 <b>New task is live</b>',
    '',
    `<b>${esc(p.channel_name)}</b>`,
    `Payout per task: <b>${naira(p.payout)}</b>`,
    `Slots: <b>${p.target_subscribers.toLocaleString()}</b>`,
    '',
    'First-come, first-served. Tap below to grab it.',
  ];
  return {
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: openAppButton('🚀 Open Highzcore', '/dashboard/worker?tab=available-tasks'),
  };
}
