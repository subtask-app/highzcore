// Shared HTML wrapper for all emails.
// Keep it inline-CSS-only; many clients strip <style>.

export const BRAND = {
  name: 'Highzcore',
  primary: '#0ea5e9',     // sky-500
  dark: '#0f172a',        // slate-900
  text: '#1f2937',        // gray-800
  muted: '#6b7280',       // gray-500
  surface: '#f8fafc',     // slate-50
  border: '#e5e7eb',      // gray-200
};

export const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://highzcore.tech';

interface LayoutInput {
  preheader?: string;          // hidden snippet shown by some clients in the inbox preview
  heading: string;
  intro?: string;
  bodyHtml: string;            // raw inner HTML for the message body
  ctaText?: string;
  ctaHref?: string;
  footerNote?: string;
}

export function layout(input: LayoutInput): string {
  const { preheader = '', heading, intro = '', bodyHtml, ctaText, ctaHref, footerNote } = input;
  const cta = ctaText && ctaHref
    ? `
      <tr><td align="center" style="padding: 28px 24px 8px;">
        <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;background:${BRAND.primary};color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;font-family:Inter,system-ui,sans-serif;">${ctaText}</a>
      </td></tr>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${BRAND.text};">
<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:${BRAND.surface};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.surface};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
      <tr><td style="padding:24px 28px;background:${BRAND.dark};color:#fff;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">${BRAND.name}</div>
      </td></tr>
      <tr><td style="padding:32px 28px 8px;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${BRAND.dark};">${heading}</h1>
        ${intro ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${intro}</p>` : ''}
      </td></tr>
      <tr><td style="padding:0 28px 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">
        ${bodyHtml}
      </td></tr>
      ${cta}
      <tr><td style="padding:24px 28px 28px;border-top:1px solid ${BRAND.border};margin-top:16px;font-size:13px;color:${BRAND.muted};line-height:1.5;">
        ${footerNote ?? `You're receiving this because you have an active account on ${BRAND.name}.`}
      </td></tr>
    </table>
    <div style="font-size:12px;color:${BRAND.muted};margin-top:18px;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</div>
  </td></tr>
</table>
</body></html>`;
}

// Currency formatter for Naira amounts inside templates.
export function naira(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}
