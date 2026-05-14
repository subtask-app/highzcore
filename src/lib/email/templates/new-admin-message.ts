import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, BRAND } from './_layout';

export function render(p: EmailPayload<'new_admin_message'>): RenderedEmail {
  const subject = `New message from Highzcore — ${p.channel_name}`;
  const url = `${appUrl()}/dashboard/client?contract=${p.contract_id}`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">Our team sent you a message about <strong>${p.channel_name}</strong>.</p>
    <blockquote style="margin:18px 0;padding:14px 18px;border-left:3px solid ${BRAND.primary};background:#f9fafb;font-size:14px;color:${BRAND.text};border-radius:0 8px 8px 0;">
      ${escapeHtml(p.preview)}
    </blockquote>
  `;

  const html = layout({
    preheader: p.preview.slice(0, 100),
    heading: 'New message from Highzcore',
    bodyHtml,
    ctaText: 'Open the conversation',
    ctaHref: url,
  });

  const text = [
    `New message about ${p.channel_name}:`,
    '',
    `"${p.preview}"`,
    '',
    `Open: ${url}`,
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
