'use client';

// /creator/projects/new/promote — Promote campaign wizard. 5 steps:
//   1. Video — paste + verify
//   2. Platforms + min audience
//   3. Share message template
//   4. Targeting + tier
//   5. Review + pay

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { WizardShell } from '@/components/onboarding/WizardShell';
import { ChipMultiSelect } from '@/components/onboarding/ChipMultiSelect';
import { VideoPreview } from '@/components/insights/VideoPreview';
import { Card, Input, ProductBadge, Select, Textarea } from '@/components/ui';
import { COUNTRIES, LANGUAGES, NICHES } from '@/lib/onboarding/catalog';
import { PROMOTE_TIERS, feeBreakdown } from '@/lib/promote/pricing';
import { createPromoteProject } from '@/lib/promote/actions';
import type { TargetDemographics } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface VideoMeta {
  id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

const PLATFORMS: { value: string; label: string }[] = [
  { value: 'twitter',          label: 'X / Twitter' },
  { value: 'instagram',        label: 'Instagram' },
  { value: 'tiktok',           label: 'TikTok' },
  { value: 'telegram_channel', label: 'Telegram channel' },
  { value: 'whatsapp_group',   label: 'WhatsApp group' },
  { value: 'facebook',         label: 'Facebook' },
  { value: 'youtube',          label: 'YouTube' },
];

const MIN_AUDIENCE_PRESETS = [100, 500, 1000, 5000, 10000];

export default function PromoteWizardPage() {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  // Step 1
  const [videoUrl, setVideoUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);

  // Step 2
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [minAudience, setMinAudience] = useState<number>(100);

  // Step 3
  const [shareMessage, setShareMessage] = useState('');

  // Step 4 — targeting + tier
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [niches, setNiches] = useState<string[]>([]);
  const [tierId, setTierId] = useState<string>('standard');

  // Step 5 — payment
  const [paymentMethod, setPaymentMethod] = useState<string>('admin_credit');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const verify = async () => {
    setVerifying(true);
    setVideoError(null);
    setVideo(null);
    try {
      const res = await fetch('/api/verify-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: videoUrl }),
      });
      const json = await res.json() as
        | { ok: true; meta: VideoMeta }
        | { ok: false; error: { code: string; reason?: string } };
      if (!json.ok) { setVideoError(videoMessage(json.error.code, json.error.reason)); return; }
      setVideo(json.meta);
    } catch {
      setVideoError("We couldn't reach YouTube. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const tier = PROMOTE_TIERS.find((t) => t.id === tierId) ?? PROMOTE_TIERS[1];
  const breakdown = feeBreakdown(tier.totalUsd, tier.shareCount);

  const canContinue = (() => {
    if (step === 0) return !!video;
    if (step === 1) return platforms.length > 0 && minAudience > 0;
    if (step === 2) return true;
    if (step === 3) return languages.length > 0 && !!tier;
    if (step === 4) return !!paymentMethod;
    return false;
  })();

  const submit = () => {
    if (!video) return;
    setSubmitting(true);
    setSubmitError(null);
    const form = new FormData();
    form.set('video_url', videoUrl);
    form.set('video_id', video.id);
    form.set('video_title', video.title);
    form.set('tier', tier.id);
    form.set('target_platforms', JSON.stringify(platforms));
    form.set('min_audience', String(minAudience));
    form.set('share_message_template', shareMessage);
    const targeting: TargetDemographics = {
      countries: countries.length ? countries : undefined,
      languages: languages.length ? languages : undefined,
      niches: niches.length ? niches : undefined,
    };
    form.set('target_demographics', JSON.stringify(targeting));
    form.set('payment_method', paymentMethod);

    startTransition(async () => {
      const result = await createPromoteProject(form);
      if (result && 'error' in result) { setSubmitError(humanise(result.error)); setSubmitting(false); }
    });
  };

  const TITLES = [
    'Which video do you want shared?',
    'Where should it be shared?',
    'Write the share message (optional)',
    'Who should see it?',
    'Review + launch',
  ];
  const DESCRIPTIONS = [
    "Paste any public YouTube URL — we'll fetch the rest.",
    'Pick the platforms and minimum follower count for the workers who share it.',
    "Optional — workers can paste this or paraphrase. Skip and they'll write their own.",
    'Tighter targeting + tier pick. Workers see your share URL with UTMs attached.',
    'Last look before workers can start claiming share slots.',
  ];

  return (
    <WizardShell
      step={step}
      steps={5}
      title={TITLES[step]}
      description={DESCRIPTIONS[step]}
      onBack={() => setStep(Math.max(0, step - 1))}
      onContinue={step < 4 ? () => setStep(step + 1) : submit}
      continueDisabled={!canContinue || submitting}
      continueLoading={submitting}
      continueLabel={step === 4 ? `Launch campaign — $${tier.totalUsd}` : undefined}
    >
      <div className="mb-6 inline-flex items-center gap-2">
        <ProductBadge product="promote" size="sm" />
        <span className="text-sm font-medium text-fg-muted">Promote</span>
      </div>

      {/* Step 1 — Video */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none"
              placeholder="https://youtube.com/watch?v=…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={verify}
              disabled={!videoUrl || verifying}
              className="inline-flex items-center justify-center h-12 px-5 rounded-md bg-brand text-brand-fg font-semibold disabled:opacity-50"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
          {videoError && <p className="text-sm text-danger">{videoError}</p>}
          {video && <VideoPreview meta={video} />}
        </div>
      )}

      {/* Step 2 — Platforms + min audience */}
      {step === 1 && (
        <div className="space-y-7">
          <FieldGroup label="Platforms" helper="Multi-select." required>
            <ChipMultiSelect options={PLATFORMS} value={platforms} onChange={setPlatforms} />
          </FieldGroup>
          <FieldGroup label="Minimum followers" required>
            <div className="flex flex-wrap items-center gap-2">
              {MIN_AUDIENCE_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinAudience(n)}
                  className={cn(
                    'inline-flex items-center h-9 px-4 rounded-full border text-sm font-medium transition-colors',
                    minAudience === n
                      ? 'bg-brand-tint border-brand text-brand'
                      : 'bg-surface border-border text-fg-muted hover:bg-surface-hover hover:text-fg',
                  )}
                >
                  {n.toLocaleString()}+
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-fg-muted">
              Only workers with at least this many verified followers on the picked platforms can
              claim a share slot.
            </p>
          </FieldGroup>
        </div>
      )}

      {/* Step 3 — Share message */}
      {step === 2 && (
        <div className="space-y-4">
          <Textarea
            label="Share message template (optional)"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="e.g. New video — I spent 3 months testing every trending tip. Here's what actually works ↓"
            rows={4}
            helper={`${shareMessage.length}/400 characters. Workers can paste this verbatim or paraphrase.`}
            maxLength={400}
          />
          <Card padding="md" className="bg-surface-hover">
            <p className="text-xs text-fg-muted leading-relaxed">
              We append a <code className="font-mono">utm_source=highzcore</code> to your video URL
              so your YouTube Studio &quot;External traffic&quot; dashboard counts these clicks.
            </p>
          </Card>
        </div>
      )}

      {/* Step 4 — Targeting + tier */}
      {step === 3 && (
        <div className="space-y-7">
          <FieldGroup label="Target countries">
            <ChipMultiSelect options={COUNTRIES.slice(0, -1)} value={countries} onChange={setCountries} max={10} />
          </FieldGroup>
          <FieldGroup label="Worker languages" required>
            <ChipMultiSelect options={LANGUAGES.slice(0, 8)} value={languages} onChange={setLanguages} />
          </FieldGroup>
          <FieldGroup label="Worker niches">
            <ChipMultiSelect options={NICHES} value={niches} onChange={setNiches} max={6} />
          </FieldGroup>
          <FieldGroup label="Tier" required>
            <div className="space-y-3">
              {PROMOTE_TIERS.map((t) => {
                const bd = feeBreakdown(t.totalUsd, t.shareCount);
                return (
                  <button key={t.id} type="button" onClick={() => setTierId(t.id)} className="w-full text-left">
                    <Card padding="md" variant="interactive" className={cn('flex items-center gap-4', tierId === t.id && 'ring-2 ring-brand')}>
                      <span className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-full',
                        tierId === t.id ? 'bg-brand text-brand-fg' : 'bg-surface-active text-fg-muted',
                      )}>{tierId === t.id && <Check className="h-5 w-5" />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-fg">
                          {t.label} · {t.shareCount} shares
                          {t.highlight && (
                            <span className="ml-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
                              {t.highlight}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-fg-muted mt-0.5">Workers earn ${bd.perTask.toFixed(2)} per share.</p>
                      </div>
                      <span className="font-mono tabular text-2xl font-semibold text-fg">${t.totalUsd}</span>
                    </Card>
                  </button>
                );
              })}
            </div>
          </FieldGroup>
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 4 && video && (
        <div className="space-y-5">
          <VideoPreview meta={video} />
          <Card padding="md" className="space-y-3">
            <Row k="Platforms" v={platforms.join(', ')} />
            <Row k="Min followers" v={minAudience.toLocaleString()} />
            <Row k="Tier" v={`${tier.label} · ${tier.shareCount} shares`} />
            <Row k="Worker payout per share" v={`$${breakdown.perTask.toFixed(2)}`} />
            <Row k="Platform fee (30%)" v={`$${breakdown.platformFee.toFixed(2)}`} />
            <hr className="border-border" />
            <Row k="Total" v={`$${breakdown.totalUsd.toFixed(2)}`} bold />
          </Card>
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'flutterwave',     label: 'Card · Flutterwave (coming soon)' },
              { value: 'ccpayment',       label: 'USDT · CCPayment (coming soon)' },
              { value: 'direct_transfer', label: 'Direct bank transfer (coming soon)' },
              { value: 'admin_credit',    label: 'Test mode — auto-launch with admin credit' },
            ]}
          />
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
        </div>
      )}
    </WizardShell>
  );
}

function FieldGroup({ label, helper, required, children }: { label: string; helper?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-fg">{label}{required && <span className="text-danger ml-0.5">*</span>}</h2>
        {helper && <span className="text-xs text-fg-subtle">{helper}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${bold ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{k}</span>
      <span className={`text-sm tabular ${bold ? 'font-bold text-fg text-lg' : 'text-fg'}`}>{v}</span>
    </div>
  );
}

function videoMessage(code: string, reason?: string): string {
  switch (code) {
    case 'no_api_key':         return 'Video verification is temporarily unavailable.';
    case 'invalid_input':      return "That doesn't look like a valid YouTube video URL.";
    case 'not_found':          return "We couldn't find that video.";
    case 'private_or_blocked': return reason ?? 'Video is private or embedding is disabled.';
    default:                   return 'YouTube returned an error. Try again.';
  }
}

function humanise(code: string): string {
  switch (code) {
    case 'video_required':        return 'Verify your video first.';
    case 'tier_required':         return 'Pick a tier.';
    case 'platforms_required':    return 'Pick at least one platform.';
    case 'min_audience_invalid':  return 'Minimum followers must be a positive number.';
    case 'not_authenticated':     return 'Session expired. Log in again.';
    default:                      return `Something went wrong: ${code}.`;
  }
}

// Suppress unused-import lint
void Input;
