'use client';

// /creator/projects/new/insights — Insights creation wizard. 5 steps:
//   1. Video — paste URL + verify
//   2. Targeting — countries, languages, niches, gender, age
//   3. Questions — default set or custom
//   4. Volume — pick a tier (Starter / Growth / Pro)
//   5. Review + pay
//
// On submit, server action creates the project + payment_intent and
// (for M6 mock-payment path) auto-captures via the SECURITY DEFINER RPC.

import { useState, useTransition } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { WizardShell } from '@/components/onboarding/WizardShell';
import { ChipMultiSelect } from '@/components/onboarding/ChipMultiSelect';
import { VideoPreview } from '@/components/insights/VideoPreview';
import { QuestionEditor } from '@/components/insights/QuestionEditor';
import {
  Card,
  Input,
  ProductBadge,
  Select,
  type Product,
} from '@/components/ui';
import { COUNTRIES, LANGUAGES, NICHES } from '@/lib/onboarding/catalog';
import { DEFAULT_QUESTIONS, expectedMinutesFor } from '@/lib/insights/questions';
import { INSIGHTS_TIERS, feeBreakdown } from '@/lib/insights/pricing';
import { createInsightsProject } from '@/lib/insights/actions';
import type { InsightQuestion, Gender, TargetDemographics } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface VideoMeta {
  id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

export default function InsightsWizardPage() {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  // Step 1
  const [videoUrl, setVideoUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);

  // Step 2 — targeting
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [niches, setNiches] = useState<string[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');

  // Step 3 — questions
  const [questionMode, setQuestionMode] = useState<'default' | 'custom'>('default');
  const [customQuestions, setCustomQuestions] = useState<InsightQuestion[]>(DEFAULT_QUESTIONS);

  // Step 4 — tier
  const [tierId, setTierId] = useState<string>('growth');

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
        | { ok: false; error: { code: string; reason?: string; message?: string } };
      if (!json.ok) {
        setVideoError(videoMessage(json.error.code, json.error.reason));
        return;
      }
      setVideo(json.meta);
    } catch {
      setVideoError("We couldn't reach YouTube. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const tier = INSIGHTS_TIERS.find((t) => t.id === tierId) ?? INSIGHTS_TIERS[1];
  const questions = questionMode === 'default' ? DEFAULT_QUESTIONS : customQuestions;
  const breakdown = feeBreakdown(tier.totalUsd, tier.responseCount);
  const expectedMin = video ? expectedMinutesFor(video.duration_seconds, questions.length) : 0;

  const canContinue = (() => {
    if (step === 0) return !!video;
    if (step === 1) return languages.length > 0;
    if (step === 2) {
      if (questionMode === 'default') return true;
      return (
        customQuestions.length > 0 &&
        customQuestions.every((q) => q.prompt.trim().length > 0) &&
        customQuestions.every((q) => q.type !== 'multiple_choice' || (q.options && q.options.length >= 2))
      );
    }
    if (step === 3) return !!tier;
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
    form.set('video_duration', String(video.duration_seconds));
    form.set('tier', tier.id);
    form.set('use_default_questions', String(questionMode === 'default'));
    form.set('questions', JSON.stringify(questionMode === 'default' ? DEFAULT_QUESTIONS : customQuestions));
    const targeting: TargetDemographics = {
      countries: countries.length ? countries : undefined,
      languages: languages.length ? languages : undefined,
      niches: niches.length ? niches : undefined,
      age_min: ageMin ? Number(ageMin) : undefined,
      age_max: ageMax ? Number(ageMax) : undefined,
      genders: genders.length ? genders : undefined,
    };
    form.set('target_demographics', JSON.stringify(targeting));
    form.set('payment_method', paymentMethod);

    startTransition(async () => {
      const result = await createInsightsProject(form);
      if (result && 'error' in result) {
        setSubmitError(humanise(result.error));
        setSubmitting(false);
      }
    });
  };

  const TITLES = [
    'Which video do you want feedback on?',
    'Who should watch it?',
    'Pick or write the questions',
    'How many responses?',
    'Review + launch',
  ];
  const DESCRIPTIONS = [
    "Paste any YouTube URL — public, embeddable. We'll fetch the rest.",
    'Tighter targeting gives sharper feedback. Skip any you don\'t care about.',
    'Default works for most. Customize if you have specific things to test.',
    'Pick a tier. Pricing scales linearly — more responses = stronger signal.',
    'Last look before workers can start claiming it.',
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
      continueLabel={step === 4 ? `Launch study — $${tier.totalUsd}` : undefined}
    >
      {/* Always show product badge at top to anchor the user */}
      <div className="mb-6 inline-flex items-center gap-2">
        <ProductBadge product={'insights' as Product} size="sm" />
        <span className="text-sm font-medium text-fg-muted">Audience Insights</span>
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
          <p className="text-xs text-fg-subtle leading-relaxed">
            The video must be public and embedding-enabled. Workers watch it through our player so
            we can track real engagement time.
          </p>
        </div>
      )}

      {/* Step 2 — Targeting */}
      {step === 1 && (
        <div className="space-y-7">
          <FieldGroup label="Target countries" helper="Skip to allow all.">
            <ChipMultiSelect options={COUNTRIES.slice(0, -1)} value={countries} onChange={setCountries} max={10} />
          </FieldGroup>
          <FieldGroup label="Languages workers must speak" required>
            <ChipMultiSelect options={LANGUAGES.slice(0, 8)} value={languages} onChange={setLanguages} />
          </FieldGroup>
          <FieldGroup label="Niches your audience already watches" helper="Multi-select.">
            <ChipMultiSelect options={NICHES} value={niches} onChange={setNiches} max={6} />
          </FieldGroup>
          <FieldGroup label="Gender (optional)">
            <ChipMultiSelect
              options={[
                { value: 'male',              label: 'Male' },
                { value: 'female',            label: 'Female' },
                { value: 'nonbinary',         label: 'Non-binary' },
                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
              value={genders}
              onChange={(v) => setGenders(v as Gender[])}
            />
          </FieldGroup>
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              type="number"
              label="Age min (optional)"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              min={18}
              max={99}
              placeholder="18"
            />
            <Input
              type="number"
              label="Age max (optional)"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              min={18}
              max={99}
              placeholder="65"
            />
          </div>
        </div>
      )}

      {/* Step 3 — Questions */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <ModeCard
              active={questionMode === 'default'}
              onClick={() => setQuestionMode('default')}
              title="Use the default set"
              description="6 carefully picked questions — works for most videos."
            />
            <ModeCard
              active={questionMode === 'custom'}
              onClick={() => setQuestionMode('custom')}
              title="Write your own"
              description="Replace or extend the default questions."
            />
          </div>
          {questionMode === 'default' ? (
            <ol className="space-y-2">
              {DEFAULT_QUESTIONS.map((q, i) => (
                <li key={q.id} className="text-sm text-fg-muted">
                  <span className="font-semibold text-fg">{i + 1}.</span> {q.prompt}
                </li>
              ))}
            </ol>
          ) : (
            <QuestionEditor value={customQuestions} onChange={setCustomQuestions} />
          )}
        </div>
      )}

      {/* Step 4 — Tier */}
      {step === 3 && (
        <div className="space-y-3">
          {INSIGHTS_TIERS.map((t) => {
            const bd = feeBreakdown(t.totalUsd, t.responseCount);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierId(t.id)}
                className="w-full text-left"
              >
                <Card
                  padding="md"
                  variant="interactive"
                  className={cn(
                    'flex items-center gap-4',
                    tierId === t.id && 'ring-2 ring-brand',
                  )}
                >
                  <span className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full',
                    tierId === t.id ? 'bg-brand text-brand-fg' : 'bg-surface-active text-fg-muted',
                  )}>
                    {tierId === t.id && <Check className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-fg">
                      {t.label} · {t.responseCount.toLocaleString()} responses
                      {t.highlight && (
                        <span className="ml-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
                          {t.highlight}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-fg-muted mt-0.5">
                      Workers earn ${bd.perTask.toFixed(2)} each. We keep {Math.round(0.30 * 100)}%.
                    </p>
                  </div>
                  <span className="font-mono tabular text-2xl font-semibold text-fg">${t.totalUsd}</span>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 4 && video && (
        <div className="space-y-5">
          <VideoPreview meta={video} />
          <Card padding="md" className="space-y-3">
            <Row k="Tier" v={`${tier.label} · ${tier.responseCount} responses`} />
            <Row k="Question count" v={String(questions.length)} />
            <Row k="Expected per-worker time" v={`${expectedMin} minutes`} />
            <Row k="Worker payout per task" v={`$${breakdown.perTask.toFixed(2)}`} />
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
            helper="Live payment integrations land in a future milestone. For now, choose Test mode to flow through the system."
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

function ModeCard({ active, onClick, title, description }: { active: boolean; onClick: () => void; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left',
      )}
    >
      <Card padding="md" variant="interactive" className={cn('h-full', active && 'ring-2 ring-brand')}>
        <p className="text-base font-semibold text-fg flex items-center gap-2">
          {active && <Check className="h-4 w-4 text-brand" />}
          {title}
        </p>
        <p className="mt-1 text-sm text-fg-muted leading-relaxed">{description}</p>
      </Card>
    </button>
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
    case 'video_required':      return 'Verify your video before launching.';
    case 'tier_required':       return 'Pick a tier.';
    case 'questions_required':  return 'Add at least one question.';
    case 'not_authenticated':   return 'Session expired. Log in again.';
    case 'project_create_failed': return "We couldn't create the project. Try again.";
    case 'payment_intent_failed': return 'Payment setup failed. Try again.';
    default:                    return `Something went wrong: ${code}.`;
  }
}

// Suppress unused-import lint
void ArrowRight;
