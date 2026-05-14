import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, BRAND } from './_layout';

export function render(p: EmailPayload<'admin_no_reply_reminder'>): RenderedEmail {
  const subject = `Unanswered client message — ${p.channel_name}`;
  const url = `${appUrl()}/dashboard/admin?contract=${p.contract_id}`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">A client is waiting on a reply about <strong>${p.channel_name}</strong>.</p>
    <blockquote style="margin:18px 0;padding:14px 18px;border-left:3px solid ${BRAND.primary};background:#f9fafb;font-size:14px;color:${BRAND.text};border-radius:0 8px 8px 0;">
      ${escapeHtml(p.preview)}
    </blockquote>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">It's been more than 2 minutes — a quick reply keeps clients confident.</p>
  `;

  const html = layout({
    preheader: 'A client is waiting on you.',
    heading: 'A client is waiting',
    bodyHtml,
    ctaText: 'Open the conversation',
    ctaHref: url,
  });

  const text = [
    `Client message awaiting reply — ${p.channel_name}`,
    '',
    `"${p.preview}"`,
    '',
    `Reply: ${url}`,
  ].join('\n');

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
