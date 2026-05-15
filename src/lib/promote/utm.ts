// UTM helpers for Promote. The share URL workers post on social already
// has UTM params so the creator's YouTube Studio "External traffic"
// dashboard attributes correctly to highzcore.tech.

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Auto-generated UTM campaign id, unique per project. Stored on
// promote_campaigns.utm_campaign with a UNIQUE constraint.
export function generateUtmCampaign(): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `hzc_${s}`;
}

// Append our UTM params to a YouTube URL.
export function buildShareUrl(videoUrl: string, opts: { campaign: string; medium?: string }): string {
  try {
    const u = new URL(videoUrl);
    u.searchParams.set('utm_source', 'highzcore');
    u.searchParams.set('utm_campaign', opts.campaign);
    if (opts.medium) u.searchParams.set('utm_medium', opts.medium);
    return u.toString();
  } catch {
    // Invalid URL — pass through unchanged.
    return videoUrl;
  }
}

// Soft URL validation for worker-submitted post URLs. We rely on admin
// review for the actual check; this just catches obvious typos.
export function postUrlLooksValid(input: string, platform: string): boolean {
  if (!input || !input.startsWith('http')) return false;
  const host = (() => {
    try { return new URL(input).hostname.toLowerCase(); } catch { return ''; }
  })();
  if (!host) return false;
  switch (platform) {
    case 'twitter':          return host.endsWith('twitter.com') || host.endsWith('x.com');
    case 'instagram':        return host.endsWith('instagram.com');
    case 'tiktok':           return host.endsWith('tiktok.com');
    case 'telegram_channel': return host === 't.me' || host === 'telegram.me';
    case 'facebook':         return host.endsWith('facebook.com') || host === 'fb.com';
    case 'youtube':          return host.endsWith('youtube.com') || host === 'youtu.be';
    // WhatsApp Status / group can't be linked publicly — workers paste a
    // best-effort URL (often a screenshot URL) and submit evidence.
    case 'whatsapp_group':   return true;
    default:                 return true;
  }
}
