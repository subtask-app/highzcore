import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, naira, BRAND } from './_layout';

export function render(p: EmailPayload<'task_approved_broadcast'>): RenderedEmail {
  const remaining = Math.max(p.target_subscribers - p.verified_count, 0);
  const subject = `New task: subscribe to ${p.channel_name} — ${naira(p.payout)}`;
  const tasksUrl = `${appUrl()}/dashboard/worker?tab=available-tasks`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">A new approved campaign is live. You can earn <strong>${naira(p.payout)}</strong> for every verified subscription.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
      <tr><td style="padding:14px 16px;font-size:14px;"><strong>Channel:</strong> ${p.channel_name}<br><a href="${p.channel_url}" style="color:${BRAND.primary};word-break:break-all;">${p.channel_url}</a></td></tr>
      <tr><td style="padding:14px 16px;font-size:14px;border-top:1px solid ${BRAND.border};background:#f0f9ff;"><strong>Slots left:</strong> <span style="font-size:18px;color:${BRAND.dark};">${remaining.toLocaleString()} of ${p.target_subscribers.toLocaleString()}</span></td></tr>
    </table>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">Tasks are first-come, first-served. They disappear when the target is reached.</p>
  `;

  const html = layout({
    preheader: `${remaining.toLocaleString()} slots left — earn ${naira(p.payout)} each.`,
    heading: 'New task is live',
    bodyHtml,
    ctaText: 'See available tasks',
    ctaHref: tasksUrl,
  });

  const text = [
    `New task: ${p.channel_name}`,
    `Payout per task: ${naira(p.payout)}`,
    `Slots left: ${remaining} of ${p.target_subscribers}`,
    `Channel: ${p.channel_url}`,
    '',
    `Available tasks: ${tasksUrl}`,
  ].join('\n');

  return { subject, html, text };
}
