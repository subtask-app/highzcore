import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, BRAND } from './_layout';

export function render(p: EmailPayload<'campaign_completed'>): RenderedEmail {
  const subject = `Campaign complete — ${p.target_subscribers.toLocaleString()} subs for ${p.channel_name}`;
  const url = `${appUrl()}/dashboard/client?contract=${p.contract_id}`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">Your campaign for <strong>${p.channel_name}</strong> has reached its target.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;overflow:hidden;">
      <tr><td style="padding:18px 20px;text-align:center;color:#065f46;">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.7;">Final count</div>
        <div style="font-size:32px;font-weight:700;margin-top:6px;">${p.target_subscribers.toLocaleString()}</div>
        <div style="font-size:14px;margin-top:4px;">verified subscribers</div>
      </td></tr>
    </table>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">Thank you for trusting us with your growth. Ready for another? Start a new campaign anytime.</p>
  `;

  const html = layout({
    preheader: `Target reached: ${p.target_subscribers.toLocaleString()} subscribers.`,
    heading: 'Campaign complete 🎉',
    bodyHtml,
    ctaText: 'View final report',
    ctaHref: url,
  });

  const text = [
    `Campaign complete — ${p.channel_name}`,
    `Final count: ${p.target_subscribers.toLocaleString()} subscribers`,
    '',
    `View: ${url}`,
  ].join('\n');

  return { subject, html, text };
}
