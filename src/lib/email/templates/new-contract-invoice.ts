import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, naira, BRAND } from './_layout';

export function render(p: EmailPayload<'new_contract_invoice'>): RenderedEmail {
  const subject = `New campaign — ${p.channel_name} (${p.target_subscribers.toLocaleString()} subs · ${naira(p.total_amount)})`;
  const dashboardUrl = `${appUrl()}/dashboard/admin`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">A client just created a new campaign. Confirm payment to activate.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
      <tr><td style="padding:14px 16px;background:#f9fafb;font-size:13px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.04em;">Invoice</td></tr>
      <tr><td style="padding:14px 16px;font-size:14px;"><strong>Client:</strong> ${p.client_name ?? p.client_email ?? '—'}<br><span style="color:${BRAND.muted}">${p.client_email ?? ''}</span></td></tr>
      <tr><td style="padding:14px 16px;font-size:14px;border-top:1px solid ${BRAND.border};"><strong>Channel:</strong> ${p.channel_name}<br><a href="${p.channel_url}" style="color:${BRAND.primary};word-break:break-all;">${p.channel_url}</a></td></tr>
      <tr><td style="padding:14px 16px;font-size:14px;border-top:1px solid ${BRAND.border};"><strong>Target subscribers:</strong> ${p.target_subscribers.toLocaleString()}</td></tr>
      <tr><td style="padding:14px 16px;font-size:14px;border-top:1px solid ${BRAND.border};background:#f0f9ff;"><strong>Total due:</strong> <span style="font-size:18px;color:${BRAND.dark};">${naira(p.total_amount)}</span></td></tr>
    </table>
    <p style="margin:0 0 6px;color:${BRAND.muted};font-size:13px;">When the client sends proof of payment, mark the campaign <em>active</em> in the admin dashboard — workers will be notified automatically.</p>
  `;

  const html = layout({
    preheader: `New ${naira(p.total_amount)} campaign awaiting payment.`,
    heading: 'New campaign awaiting payment',
    bodyHtml,
    ctaText: 'Open admin dashboard',
    ctaHref: dashboardUrl,
  });

  const text = [
    `New campaign — ${p.channel_name}`,
    `Client: ${p.client_name ?? p.client_email ?? '—'} (${p.client_email ?? ''})`,
    `Channel: ${p.channel_url}`,
    `Target: ${p.target_subscribers.toLocaleString()} subscribers`,
    `Total due: ${naira(p.total_amount)}`,
    '',
    `Open admin dashboard: ${dashboardUrl}`,
  ].join('\n');

  return { subject, html, text };
}
