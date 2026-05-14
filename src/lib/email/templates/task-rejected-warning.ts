import type { EmailPayload, RenderedEmail } from '../types';
import { appUrl, layout, BRAND } from './_layout';

// Warm, "romantic" tone per the spec — corrective without scolding.
export function render(p: EmailPayload<'task_rejected_warning'>): RenderedEmail {
  const subject = `A quick word about your last task — ${p.channel_name}`;
  const url = `${appUrl()}/dashboard/worker?tab=my-tasks`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">Hey — we just looked at your last submission for <strong>${p.channel_name}</strong>, and we couldn't confirm the subscription. It happens, but we wanted to flag it kindly before it becomes a pattern.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border:1px solid #fde68a;background:#fffbeb;border-radius:10px;overflow:hidden;">
      <tr><td style="padding:14px 18px;font-size:14px;color:#92400e;">
        <div style="font-weight:600;margin-bottom:4px;">Why this matters</div>
        <div style="font-size:13px;line-height:1.6;">${escapeHtml(p.reason)} — repeated unverified submissions can lead to a temporary hold on your account. We'd rather not, and we know you'd rather not either.</div>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;">If you genuinely subscribed and think the verification missed it, head back to the task and try again — sometimes YouTube takes a moment to register a new subscription on its API. If you haven't yet, hold off on tapping "I'm done" until you've subscribed with the same Google account you signed up with.</p>
    <p style="margin:0;color:${BRAND.muted};font-size:13px;">We're rooting for you. Thank you for keeping the platform honest.</p>
  `;

  const html = layout({
    preheader: 'A gentle heads-up about your last task.',
    heading: 'A gentle heads-up',
    bodyHtml,
    ctaText: 'Review my tasks',
    ctaHref: url,
    footerNote: 'This is a one-time courtesy notice. Repeat unverified submissions may pause withdrawals.',
  });

  const text = [
    `A note about your task on ${p.channel_name}:`,
    '',
    `We couldn't verify your subscription. ${p.reason}`,
    '',
    'Repeated unverified submissions can lead to a hold. If you did subscribe, give YouTube a moment and try again from the task page.',
    '',
    `My tasks: ${url}`,
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
