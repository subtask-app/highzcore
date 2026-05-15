'use client';

// Creator onboarding wizard — 4 steps:
//   1. About you           (full name, country, business name)
//   2. Your channel        (URL → verify via /api/verify-channel preview)
//   3. About your channel  (subscriber bracket, niche, upload cadence)
//   4. Your goals          (growth goals — multi-select; how-did-you-hear)

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { WizardShell } from '@/components/onboarding/WizardShell';
import { ChipMultiSelect, ChipSingleSelect } from '@/components/onboarding/ChipMultiSelect';
import { Avatar, Card, Input, Select, Textarea } from '@/components/ui';
import {
  COUNTRIES,
  GROWTH_GOALS,
  NICHES,
  REFERRAL_SOURCES,
  SUBSCRIBER_BRACKETS,
  UPLOAD_CADENCES,
} from '@/lib/onboarding/catalog';
import { completeCreatorOnboarding } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

interface ChannelPreview {
  id: string;
  title: string;
  handle: string | null;
  avatar_url: string | null;
  subscriber_count: number | null;
}

export default function CreatorOnboardingPage() {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  // Step 1
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2
  const [channelInput, setChannelInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelPreview | null>(null);

  // Step 3
  const [subscriberBracket, setSubscriberBracket] = useState<string | null>(null);
  const [niche, setNiche] = useState<string | null>(null);
  const [cadence, setCadence] = useState<string | null>(null);

  // Step 4
  const [goals, setGoals] = useState<string[]>([]);
  const [howDidYouHear, setHowDidYouHear] = useState<string>('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const verify = async () => {
    setVerifying(true);
    setVerifyError(null);
    setChannel(null);
    try {
      const res = await fetch('/api/verify-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: channelInput }),
      });
      const json = await res.json() as { ok: boolean; meta?: ChannelPreview; error?: { code: string } };
      if (!json.ok || !json.meta) {
        setVerifyError(verifyMessage(json.error?.code));
        return;
      }
      setChannel(json.meta);
    } catch {
      setVerifyError('Connection error — try again.');
    } finally {
      setVerifying(false);
    }
  };

  const canContinue = (() => {
    if (step === 0) return fullName.length > 1 && country.length > 0;
    if (step === 1) return !!channel;
    if (step === 2) return !!subscriberBracket && !!niche && !!cadence;
    if (step === 3) return goals.length > 0;
    return false;
  })();

  const continueOrSubmit = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    // Final step — submit.
    const form = new FormData();
    form.set('full_name', fullName);
    form.set('business_name', businessName);
    form.set('country', country);
    form.set('phone', phone);
    form.set('channel_url', channelInput);
    if (channel) {
      form.set('channel_id', channel.id);
      form.set('channel_handle', channel.handle ?? '');
      form.set('channel_avatar_url', channel.avatar_url ?? '');
    }
    if (subscriberBracket) form.set('subscriber_bracket', subscriberBracket);
    if (niche) form.set('channel_niche', niche);
    if (cadence) form.set('upload_cadence', cadence);
    goals.forEach((g) => form.append('growth_goals', g));
    if (howDidYouHear) form.set('how_did_you_hear', howDidYouHear);
    setSubmitting(true);
    setSubmitError(null);
    startTransition(async () => {
      const result = await completeCreatorOnboarding(form);
      if (result && 'error' in result) {
        setSubmitError(verifyMessage(result.error));
        setSubmitting(false);
      }
      // On success, the action redirects.
    });
  };

  const TITLES = [
    'A few details about you',
    'Add your channel',
    'About your channel',
    "What's your top goal?",
  ];
  const DESCRIPTIONS = [
    "We'll use this to show you the right reports and route your studies to the right workers.",
    "Paste your channel URL or @handle — we'll fetch the rest from YouTube.",
    "Helps us recommend the right products and price studies sensibly for your size.",
    "Pick the goals that matter most. We'll show you product suggestions for them on your home screen.",
  ];

  return (
    <WizardShell
      step={step}
      steps={4}
      title={TITLES[step]}
      description={DESCRIPTIONS[step]}
      onBack={() => setStep(Math.max(0, step - 1))}
      onContinue={continueOrSubmit}
      continueDisabled={!canContinue || submitting}
      continueLoading={submitting}
      continueLabel={step === 3 ? 'Finish setup' : undefined}
    >
      {step === 0 && (
        <div className="space-y-5">
          <Input
            label="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="What should we call you?"
          />
          <Input
            label="Business or channel name (optional)"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            helper="Shown on your invoices. Defaults to your channel name once we connect it."
          />
          <Select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={COUNTRIES}
            placeholder="Pick your country"
            required
          />
          <Input
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+234 …"
            helper="We only use this for security alerts and payment notifications."
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-fg">YouTube channel URL or @handle</label>
            <div className="flex gap-2">
              <input
                className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none"
                placeholder="@yourchannel  or  youtube.com/@yourchannel"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
              />
              <button
                type="button"
                onClick={verify}
                disabled={!channelInput || verifying}
                className="inline-flex items-center justify-center h-12 px-5 rounded-md bg-brand text-brand-fg font-semibold disabled:opacity-50"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </button>
            </div>
            {verifyError && <p className="text-sm text-danger">{verifyError}</p>}
            <p className="text-xs text-fg-subtle leading-relaxed">
              We only read public info (handle, name, avatar, subscriber count). You'll grant
              read-only access separately if you ever need our reports tied to your YouTube account.
            </p>
          </div>

          {channel && (
            <Card padding="md" className="border-success/40 bg-[color-mix(in_srgb,var(--c-success)_6%,transparent)]">
              <div className="flex items-center gap-4">
                <Avatar src={channel.avatar_url ?? undefined} name={channel.title} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-fg flex items-center gap-2">
                    {channel.title}
                    <Check className="h-4 w-4 text-success" />
                  </p>
                  {channel.handle && <p className="text-sm text-fg-muted">@{channel.handle}</p>}
                  {channel.subscriber_count !== null && (
                    <p className="text-xs text-fg-subtle">
                      {channel.subscriber_count.toLocaleString()} subscribers
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-7">
          <FieldGroup label="How many subscribers do you have?" required>
            <ChipSingleSelect options={SUBSCRIBER_BRACKETS} value={subscriberBracket} onChange={setSubscriberBracket} />
          </FieldGroup>
          <FieldGroup label="What's your main niche?" required>
            <ChipSingleSelect options={NICHES} value={niche} onChange={setNiche} />
          </FieldGroup>
          <FieldGroup label="How often do you upload?" required>
            <ChipSingleSelect options={UPLOAD_CADENCES} value={cadence} onChange={setCadence} />
          </FieldGroup>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-7">
          <FieldGroup label="Pick the goals that matter most" required helper="Multi-select.">
            <ChipMultiSelect options={GROWTH_GOALS} value={goals} onChange={setGoals} />
          </FieldGroup>
          <Select
            label="How did you hear about Highzcore? (optional)"
            value={howDidYouHear}
            onChange={(e) => setHowDidYouHear(e.target.value)}
            options={REFERRAL_SOURCES}
            placeholder="Pick one"
          />
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
        </div>
      )}
    </WizardShell>
  );
}

function FieldGroup({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
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

function verifyMessage(code: string | undefined): string {
  switch (code) {
    case 'no_api_key':  return 'Channel verification is temporarily unavailable. Try again in a few minutes.';
    case 'invalid_input': return "That doesn't look like a valid channel URL or handle.";
    case 'not_found':   return "We couldn't find that channel. Double-check the URL or @handle.";
    case 'api_error':   return 'YouTube returned an error. Try again.';
    case 'channel_required': return 'Add and verify your channel before continuing.';
    default:            return 'Something went wrong. Try again.';
  }
}

// Suppress unused-import lint for Textarea (kept for future fields).
void Textarea;
