// Notification template registry. Each key maps to a renderer that takes
// the template_data and returns the rendered Telegram-flavored message
// (HTML body + optional inline keyboard).
//
// Voice: per BRAND.md — clear, calm, warm, no manipulation, one emoji max.

import type {
  NotificationPayload,
  NotificationTemplateKey,
  RenderedMessage,
} from './types';

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
}

function esc(s: string): string {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function usd(n: number, decimals = 2): string {
  return `$${Number(n).toFixed(decimals)}`;
}

function webAppButton(label: string, path: string): RenderedMessage['reply_markup'] | undefined {
  const url = `${appUrl()}${path}`;
  if (!url.startsWith('https://')) return undefined;
  return { inline_keyboard: [[{ text: label, web_app: { url } }]] };
}

// ── Renderers ──────────────────────────────────────────────────────────────

type Renderer<K extends NotificationTemplateKey> = (data: NotificationPayload<K>) => RenderedMessage;

const renderers: { [K in NotificationTemplateKey]: Renderer<K> } = {
  'task.approved': (d) => ({
    text: [
      `💰 <b>Task approved — ${usd(d.amount_usd)}</b>`,
      '',
      `Your work on <i>${esc(d.project_title)}</i> was approved.`,
      `The payout is now in your <b>Available</b> balance.`,
    ].join('\n'),
    reply_markup: webAppButton('Open earnings', '/worker/earnings'),
  }),

  'task.rejected': (d) => ({
    text: [
      `⚠️ <b>Task rejected</b>`,
      '',
      `Your submission on <i>${esc(d.project_title)}</i> wasn't approved.`,
      ``,
      `Reason: <i>${esc(d.reason)}</i>`,
      ``,
      `The pending payout was released. Pick up another task whenever you're ready.`,
    ].join('\n'),
    reply_markup: webAppButton('Browse tasks', '/worker/tasks'),
  }),

  'audience.verified': (d) => ({
    text: [
      `✓ <b>Audience verified</b>`,
      '',
      `Your <b>${esc(d.platform)}</b> account <code>@${esc(d.handle)}</code> is verified.`,
      `You can now claim Promote campaigns matching this platform.`,
    ].join('\n'),
    reply_markup: webAppButton('Browse Promote tasks', '/worker/tasks'),
  }),

  'audience.rejected': (d) => ({
    text: [
      `⚠️ <b>Audience not verified</b>`,
      '',
      `We couldn't verify your <b>${esc(d.platform)}</b> account <code>@${esc(d.handle)}</code>.`,
      ``,
      `Reason: <i>${esc(d.reason)}</i>`,
      ``,
      `Re-add it with updated info — we'll review again.`,
    ].join('\n'),
    reply_markup: webAppButton('Manage audiences', '/worker/audiences'),
  }),

  'withdrawal.completed': (d) => ({
    text: [
      `✅ <b>Withdrawal completed</b>`,
      '',
      `${usd(d.net_usd)} arrived in your wallet.`,
      `Tx: <code>${esc(d.tx_hash.slice(0, 18))}…</code>`,
    ].join('\n'),
    reply_markup: webAppButton('Open earnings', '/worker/earnings'),
  }),

  'withdrawal.failed': (d) => ({
    text: [
      `⚠️ <b>Withdrawal failed — refunded</b>`,
      '',
      `Your ${usd(d.amount_usd)} withdrawal didn't go through.`,
      `Reason: <i>${esc(d.reason)}</i>`,
      ``,
      `The amount was returned to your Available balance.`,
    ].join('\n'),
    reply_markup: webAppButton('Try again', '/worker/earnings/withdraw'),
  }),

  'collab.proposed': (d) => ({
    text: [
      `🤝 <b>New collab proposal</b>`,
      '',
      `Type: <b>${esc(d.kind)}</b>`,
      `Their escrow: <b>${usd(d.escrow_usd)}</b>`,
      ``,
      `Review terms and accept or decline.`,
    ].join('\n'),
    reply_markup: webAppButton('Open proposal', `/creator/collab/${d.project_id}`),
  }),

  'collab.accepted': (d) => ({
    text: [
      `✅ <b>Your collab proposal was accepted</b>`,
      '',
      `Both escrows are in. You can now start delivering on your end.`,
    ].join('\n'),
    reply_markup: webAppButton('Open collab', `/creator/collab/${d.project_id}`),
  }),

  'collab.declined': (d) => ({
    text: [
      `↩ <b>Your collab proposal was declined</b>`,
      '',
      d.reason ? `Reason: <i>${esc(d.reason)}</i>` : `No reason given.`,
    ].join('\n'),
    reply_markup: webAppButton('Open collab', `/creator/collab/${d.project_id}`),
  }),

  'collab.confirm': (d) => ({
    text: d.both_confirmed
      ? [
          `🎉 <b>Collab completed</b>`,
          '',
          `Both sides confirmed — escrow released back to each creator.`,
        ].join('\n')
      : [
          `📌 <b>Counterparty confirmed completion</b>`,
          '',
          `They marked the collab done. Confirm on your side when you're ready.`,
        ].join('\n'),
    reply_markup: webAppButton('Open collab', `/creator/collab/${d.project_id}`),
  }),

  'project.first_responses': (d) => ({
    text: [
      `📈 <b>First responses are in</b>`,
      '',
      `<i>${esc(d.project_title)}</i> has ${d.count} response${d.count === 1 ? '' : 's'} so far.`,
      ``,
      `We'll text you again at every 25 responses + when it fills.`,
    ].join('\n'),
    reply_markup: webAppButton('Open report', `/creator/projects/${d.project_id}/report`),
  }),

  'project.completed': (d) => ({
    text: [
      `✅ <b>Project completed</b>`,
      '',
      `<i>${esc(d.project_title)}</i> reached its target.`,
      `Open the full report when you're ready.`,
    ].join('\n'),
    reply_markup: webAppButton('Open report', `/creator/projects/${d.project_id}/report`),
  }),

  // ── Channel broadcasts ──────────────────────────────────────────────────
  // These go to TELEGRAM_CHANNEL with no user_id, so the inline keyboard
  // can use a URL button rather than web_app (channel posts can't have
  // web_app buttons since there's no per-user initData).

  'channel.new_insights': (d) => ({
    text: [
      `🆕 <b>Audience Insights task — ${usd(d.per_task_usd)}/response</b>`,
      '',
      `<i>${esc(d.project_title)}</i>`,
      `${d.target_count} slots available.`,
      ``,
      `Watch a video, answer 5-10 questions, earn.`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: 'Claim a slot', url: `${appUrl()}/worker/tasks` }]],
    },
  }),

  'channel.new_promote': (d) => ({
    text: [
      `📣 <b>Promote campaign — ${usd(d.per_task_usd)}/share</b>`,
      '',
      `<i>${esc(d.project_title)}</i>`,
      `Platforms: ${d.platforms.map(esc).join(', ')}`,
      ``,
      `Share to your verified audience and earn.`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: 'Claim a share', url: `${appUrl()}/worker/tasks` }]],
    },
  }),

  'channel.new_abtest': (d) => ({
    text: [
      `🅰️🅱️ <b>${d.kind === 'thumbnail' ? 'Thumbnail' : 'Title'} test — ${usd(d.per_task_usd)}/vote</b>`,
      '',
      `<i>${esc(d.project_title)}</i>`,
      ``,
      `Quick click-test. Takes under 30 seconds.`,
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: 'Claim a vote slot', url: `${appUrl()}/worker/tasks` }]],
    },
  }),

  'channel.announcement': (d) => ({
    text: [
      `📌 <b>${esc(d.subject)}</b>`,
      '',
      esc(d.body),
    ].join('\n'),
  }),
};

export function renderNotification<K extends NotificationTemplateKey>(
  key: K,
  data: NotificationPayload<K>,
): RenderedMessage {
  const renderer = renderers[key] as Renderer<K>;
  if (!renderer) {
    return {
      text: `<b>Highzcore</b>: ${esc(JSON.stringify(data).slice(0, 200))}`,
    };
  }
  try {
    return renderer(data);
  } catch (err) {
    return {
      text: `<b>Highzcore</b> ⚠️ template render failed (${key})\n\n${esc(err instanceof Error ? err.message : 'unknown')}`,
    };
  }
}
