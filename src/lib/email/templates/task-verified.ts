import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, naira, BRAND } from './_layout';

export function render(p: EmailPayload<'task_verified'>): RenderedEmail {
  const subject = `Task approved — ${naira(p.payout_amount)} added to your wallet`;
  const url = `${appUrl()}/dashboard/worker?tab=withdrawals`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">Your subscription to <strong>${p.channel_name}</strong> was confirmed. Nice work.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;background:#ecfdf5;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.7;">Credited</div>
        <div style="font-size:28px;font-weight:700;margin-top:6px;">${naira(p.payout_amount)}</div>
      </td></tr>
    </table>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">Your balance updates instantly. Withdraw anytime above the ₦1,000 minimum.</p>
  `;

  const html = layout({
    preheader: `${naira(p.payout_amount)} credited to your wallet.`,
    heading: 'Task approved',
    bodyHtml,
    ctaText: 'View your wallet',
    ctaHref: url,
  });

  const text = [
    `Your task on ${p.channel_name} was verified.`,
    `Credited: ${naira(p.payout_amount)}`,
    '',
    `Wallet: ${url}`,
  ].join('\n');

  return { subject, html, text };
}
