'use client';

// /creator/projects/new/abtest — A/B test creation wizard. 5 steps:
//   1. Kind — thumbnail or title
//   2. Variants — upload thumbnails or type title variants (2-4)
//   3. Targeting (countries, languages, niches)
//   4. Volume (tier)
//   5. Review + pay

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { WizardShell } from '@/components/onboarding/WizardShell';
import { ChipMultiSelect } from '@/components/onboarding/ChipMultiSelect';
import { VariantUploader, makeBlankVariants } from '@/components/abtest/VariantUploader';
import { Card, Input, ProductBadge, Select } from '@/components/ui';
import { COUNTRIES, LANGUAGES, NICHES } from '@/lib/onboarding/catalog';
import { ABTEST_TIERS, feeBreakdown } from '@/lib/abtest/pricing';
import { createAbtestProject } from '@/lib/abtest/actions';
import type { AbtestKind, AbtestVariant, TargetDemographics } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export default function AbtestWizardPage() {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  const [kind, setKind] = useState<AbtestKind>('thumbnail');
  const [variants, setVariants] = useState<AbtestVariant[]>(makeBlankVariants('thumbnail'));
  const [videoUrl, setVideoUrl] = useState('');
  const [testTitle, setTestTitle] = useState('');

  // Targeting
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [niches, setNiches] = useState<string[]>([]);

  // Tier
  const [tierId, setTierId] = useState<string>('standard');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('admin_credit');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onKindChange = (k: AbtestKind) => {
    if (k === kind) return;
    setKind(k);
    setVariants(makeBlankVariants(k));
  };

  const tier = ABTEST_TIERS.find((t) => t.id === tierId) ?? ABTEST_TIERS[1];
  const breakdown = feeBreakdown(tier.totalUsd, tier.voteCount);

  const variantsValid = (() => {
    if (variants.length < 2 || variants.length > 4) return false;
    for (const v of variants) {
      if (kind === 'thumbnail' && (!v.image_url || v.image_url.length < 5)) return false;
      if (kind === 'title' && (!v.text || v.text.trim().length < 1)) return false;
    }
    return true;
  })();

  const canContinue = (() => {
    if (step === 0) return true;
    if (step === 1) return variantsValid;
    if (step === 2) return languages.length > 0;
    if (step === 3) return !!tier;
    if (step === 4) return !!paymentMethod;
    return false;
  })();

  const submit = () => {
    setSubmitting(true);
    setSubmitError(null);
    const form = new FormData();
    form.set('kind', kind);
    form.set('video_url', videoUrl.trim());
    form.set('video_title', testTitle.trim());
    form.set('test_title', testTitle.trim());
    form.set('tier', tier.id);
    form.set('variants', JSON.stringify(variants));
    const targeting: TargetDemographics = {
      countries: countries.length ? countries : undefined,
      languages: languages.length ? languages : undefined,
      niches: niches.length ? niches : undefined,
    };
    form.set('target_demographics', JSON.stringify(targeting));
    form.set('payment_method', paymentMethod);

    startTransition(async () => {
      const result = await createAbtestProject(form);
      if (result && 'error' in result) {
        setSubmitError(humanise(result.error));
        setSubmitting(false);
      }
    });
  };

  const TITLES = [
    "What are you testing?",
    'Add your variants',
    'Who should vote?',
    'How many votes?',
    'Review + launch',
  ];
  const DESCRIPTIONS = [
    "Pick thumbnail or title. We'll show your audience both side-by-side.",
    "Upload 2–4 thumbnails or type 2–4 titles. Workers see them in randomized order.",
    "Tighter targeting gives sharper results. Skip what you don't care about.",
    'Pick a volume — more votes = stronger statistical signal.',
    'Last look before workers can start voting.',
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
      continueLabel={step === 4 ? `Launch test — $${tier.totalUsd}` : undefined}
    >
      <div className="mb-6 inline-flex items-center gap-2">
        <ProductBadge product="abtest" size="sm" />
        <span className="text-sm font-medium text-fg-muted">Thumbnail &amp; Title Testing</span>
      </div>

      {/* Step 1 — Kind */}
      {step === 0 && (
        <div className="space-y-4">
          <KindCard
            active={kind === 'thumbnail'}
            onClick={() => onKindChange('thumbnail')}
            title="Thumbnail test"
            description="Upload 2–4 thumbnail images. Workers pick which one they'd click."
          />
          <KindCard
            active={kind === 'title'}
            onClick={() => onKindChange('title')}
            title="Title test"
            description="Write 2–4 title variants. Workers pick which they'd click."
          />
          <Input
            label="Reference video (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            helper="If this is for an existing video, paste the URL — appears on the project page for context."
          />
          <Input
            label="Internal name"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="e.g. Thumbnail test — Sept 30 vlog"
            helper="Shown on your project list."
          />
        </div>
      )}

      {/* Step 2 — Variants */}
      {step === 1 && (
        <div className="space-y-3">
          <VariantUploader kind={kind} value={variants} onChange={setVariants} />
          {!variantsValid && (
            <p className="text-xs text-fg-muted">
              Add {kind === 'thumbnail' ? 'an image' : 'text'} for every variant before continuing.
            </p>
          )}
        </div>
      )}

      {/* Step 3 — Targeting */}
      {step === 2 && (
        <div className="space-y-7">
          <FieldGroup label="Target countries" helper="Skip to allow all.">
            <ChipMultiSelect options={COUNTRIES.slice(0, -1)} value={countries} onChange={setCountries} max={10} />
          </FieldGroup>
          <FieldGroup label="Languages workers must speak" required>
            <ChipMultiSelect options={LANGUAGES.slice(0, 8)} value={languages} onChange={setLanguages} />
          </FieldGroup>
          <FieldGroup label="Niches" helper="Multi-select.">
            <ChipMultiSelect options={NICHES} value={niches} onChange={setNiches} max={6} />
          </FieldGroup>
        </div>
      )}

      {/* Step 4 — Tier */}
      {step === 3 && (
        <div className="space-y-3">
          {ABTEST_TIERS.map((t) => {
            const bd = feeBreakdown(t.totalUsd, t.voteCount);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierId(t.id)}
                className="w-full text-left"
              >
                <Card padding="md" variant="interactive" className={cn('flex items-center gap-4', tierId === t.id && 'ring-2 ring-brand')}>
                  <span className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full',
                    tierId === t.id ? 'bg-brand text-brand-fg' : 'bg-surface-active text-fg-muted',
                  )}>
                    {tierId === t.id && <Check className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-fg">
                      {t.label} · {t.voteCount.toLocaleString()} votes
                      {t.highlight && (
                        <span className="ml-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
                          {t.highlight}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-fg-muted mt-0.5">
                      Workers earn ${bd.perTask.toFixed(2)} each.
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
      {step === 4 && (
        <div className="space-y-5">
          <Card padding="md" className="space-y-3">
            <Row k="Kind" v={kind === 'thumbnail' ? 'Thumbnail test' : 'Title test'} />
            <Row k="Variants" v={`${variants.length}`} />
            <Row k="Tier" v={`${tier.label} · ${tier.voteCount} votes`} />
            <Row k="Worker payout per vote" v={`$${breakdown.perTask.toFixed(2)}`} />
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

function KindCard({ active, onClick, title, description }: { active: boolean; onClick: () => void; title: string; description: string }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
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

function humanise(code: string): string {
  switch (code) {
    case 'kind_required':         return 'Pick a kind first.';
    case 'tier_required':         return 'Pick a tier.';
    case 'variants_count':        return 'Add 2–4 variants.';
    case 'variants_shape':        return 'Every variant needs an id + label.';
    case 'variants_thumbnail_url':return 'Upload an image for every variant.';
    case 'variants_title_text':   return 'Write text for every title variant.';
    case 'not_authenticated':     return 'Your session expired. Log in again.';
    default:                      return `Something went wrong: ${code}.`;
  }
}
