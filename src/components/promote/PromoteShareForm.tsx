'use client';

// Worker-side share submission form for a Promote campaign.
//
// Flow:
//   1. Worker picks which of their verified audiences to use
//   2. Copies the share URL (with UTMs) + optional share message
//   3. Goes to the platform, posts, comes back
//   4. Pastes the URL of their post (+ optional evidence screenshot)
//   5. Submits

import { useMemo, useState, useTransition } from 'react';
import { Copy, ExternalLink, ImageUp, Loader2 } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { uploadImage, BUCKET_AUDIENCE_EVIDENCE } from '@/lib/storage/upload';
import { submitPromoteShare } from '@/lib/promote/actions';
import { buildShareUrl, postUrlLooksValid } from '@/lib/promote/utm';
import type { AudiencePlatform, WorkerAudienceRow } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const PLATFORM_LABEL: Record<AudiencePlatform, string> = {
  twitter:          'X / Twitter',
  instagram:        'Instagram',
  tiktok:           'TikTok',
  telegram_channel: 'Telegram channel',
  whatsapp_group:   'WhatsApp group',
  facebook:         'Facebook',
  youtube:          'YouTube',
};

interface Props {
  taskId: string;
  videoUrl: string;
  utmCampaign: string;
  shareMessage: string | null;
  eligibleAudiences: WorkerAudienceRow[];
}

export function PromoteShareForm({ taskId, videoUrl, utmCampaign, shareMessage, eligibleAudiences }: Props) {
  const [audienceId, setAudienceId] = useState<string>(eligibleAudiences[0]?.id ?? '');
  const audience = eligibleAudiences.find((a) => a.id === audienceId) ?? null;
  const [postUrl, setPostUrl] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shareUrl = useMemo(() => {
    return buildShareUrl(videoUrl, {
      campaign: utmCampaign,
      medium: audience?.platform,
    });
  }, [videoUrl, utmCampaign, audience]);

  const postUrlValid = audience && postUrl ? postUrlLooksValid(postUrl, audience.platform) : false;
  const canSubmit = !!audience && !!postUrl && postUrlValid && !pending;

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* no-op */ }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadImage(file, BUCKET_AUDIENCE_EVIDENCE);
    setUploading(false);
    if (!result.ok) {
      setUploadError(humanise(result.error));
      return;
    }
    setEvidenceUrl(result.url);
  };

  const submit = () => {
    if (!audience) { setError('Pick an audience first.'); return; }
    if (!postUrlValid) { setError("That doesn't look like a valid URL for that platform."); return; }
    setError(null);
    startTransition(async () => {
      const result = await submitPromoteShare(taskId, {
        platform: audience.platform,
        audience_id: audience.id,
        post_url: postUrl.trim(),
        evidence_url: evidenceUrl,
      });
      if ('error' in result) setError(humanise(result.error));
    });
  };

  if (eligibleAudiences.length === 0) {
    return (
      <Card padding="md" className="space-y-3">
        <p className="text-sm text-fg">
          You need a verified audience on one of this campaign's target platforms to claim this share.
        </p>
        <p className="text-xs text-fg-muted">
          Go to <a href="/worker/audiences" className="text-brand font-semibold">Audiences</a>{' '}
          and link your accounts, then come back.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — pick audience */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
          1 · Which audience will you post to?
        </h2>
        <div className="space-y-2">
          {eligibleAudiences.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudienceId(a.id)}
              className="w-full text-left"
            >
              <Card
                padding="md"
                className={cn(
                  'flex items-center justify-between gap-3',
                  audienceId === a.id && 'ring-2 ring-brand',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">
                    {PLATFORM_LABEL[a.platform]} · @{a.handle}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {(a.verified_follower_count ?? 0).toLocaleString()} followers
                  </p>
                </div>
                {audienceId === a.id && (
                  <span className="text-xs font-semibold text-brand">Selected</span>
                )}
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — copy share content */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
          2 · Copy + post
        </h2>
        <Card padding="md" className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-fg-muted">Share URL (with tracking attached)</p>
            <div className="flex items-stretch gap-2">
              <input
                value={shareUrl}
                readOnly
                className="h-10 flex-1 rounded-md border border-border bg-surface-hover px-3 text-xs font-mono text-fg"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => copy(shareUrl)} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                Copy
              </Button>
            </div>
          </div>
          {shareMessage && (
            <div className="space-y-1">
              <p className="text-xs text-fg-muted">Share message</p>
              <div className="flex items-start gap-2">
                <p className="flex-1 rounded-md border border-border bg-surface-hover px-3 py-2 text-sm text-fg whitespace-pre-wrap">
                  {shareMessage}
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={() => copy(shareMessage)} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                  Copy
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-fg-muted leading-relaxed">
            Open {audience ? PLATFORM_LABEL[audience.platform] : 'your platform'} and post the share URL
            {shareMessage ? ' along with the message above (or paraphrase it).' : '.'} You can rewrite
            the message — sound like yourself.
          </p>
        </Card>
      </section>

      {/* Step 3 — submit proof */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
          3 · Paste your post URL
        </h2>
        <Card padding="md" className="space-y-4">
          <Input
            label="URL of your post"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://x.com/yourhandle/status/…"
            helper={postUrl && !postUrlValid ? `URL should be on ${audience ? PLATFORM_LABEL[audience.platform] : 'the right platform'}.` : undefined}
            error={postUrl && !postUrlValid ? 'Wrong domain for the picked platform.' : undefined}
          />
          <div>
            <label className="text-sm font-medium text-fg block mb-2">
              Screenshot of your post (optional)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-surface-hover">
              {uploading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ImageUp className="h-4 w-4" />}
              {evidenceUrl ? 'Replace screenshot' : 'Upload screenshot'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} />
            </label>
            {evidenceUrl && (
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand mt-2"
              >
                View uploaded screenshot <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {uploadError && <p className="mt-1 text-xs text-danger">{uploadError}</p>}
            <p className="mt-1 text-xs text-fg-subtle leading-relaxed">
              Helps the admin verify quickly. Not required but speeds approval.
            </p>
          </div>
        </Card>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="button" size="lg" fullWidth onClick={submit} disabled={!canSubmit} loading={pending}>
        Submit share
      </Button>
      <p className="text-xs text-fg-subtle text-center">
        Your payout moves into Pending once you submit, and lands in your balance after admin approval.
      </p>

      <Textarea
        // sentinel — keep unused for forward compat with notes
        className="hidden"
        value=""
        onChange={() => {}}
      />
    </div>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'unsupported_type':    return 'PNG, JPG, or WebP only.';
    case 'file_too_large':      return 'Max 10MB.';
    case 'platform_required':   return 'Pick which platform you\'ll post to.';
    case 'audience_required':   return 'Pick which audience to use.';
    case 'post_url_invalid':    return "That doesn't look like a valid URL for the picked platform.";
    case 'audience_not_yours':  return 'That audience isn\'t linked to your account.';
    case 'audience_not_verified': return 'That audience isn\'t verified yet — admin still reviewing.';
    case 'platform_mismatch':   return 'Platform doesn\'t match the audience you picked.';
    case 'not_authenticated':   return 'Your session expired. Log in again.';
    default:                    return `Something went wrong: ${code}.`;
  }
}
