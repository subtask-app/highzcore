import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, BRAND } from './_layout';

export function render(p: EmailPayload<'client_no_reply_reminder'>): RenderedEmail {
  const subject = `Reminder: we're awaiting your reply — ${p.channel_name}`;
  const url = `${appUrl()}/dashboard/client?contract=${p.contract_id}`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">Our team replied about <strong>${p.channel_name}</strong> and we haven't heard back.</p>
    <blockquote style="margin:18px 0;padding:14px 18px;border-left:3px solid ${BRAND.primary};background:#f9fafb;font-size:14px;color:${BRAND.text};border-radius:0 8px 8px 0;">
      ${escapeHtml(p.preview)}
    </blockquote>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">Pick up where you left off whenever you're ready.</p>
  `;

  const html = layout({
    preheader: 'You have a message from the Highzcore team.',
    heading: 'A friendly nudge',
    bodyHtml,
    ctaText: 'Reply in your dashboard',
    ctaHref: url,
  });

  const text = [
    `Reminder — your campaign for ${p.channel_name}`,
    '',
    `"${p.preview}"`,
    '',
    `Open dashboard: ${url}`,
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
