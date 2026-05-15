'use client';

// Worker onboarding wizard — 5 steps:
//   1. About you            (full name, country, state, city, phone)
//   2. Date of birth + gender
//   3. Languages you speak  (multi-select)
//   4. Niches you'd watch + devices + hours
//   5. Bio (optional) + finish

import { useState, useTransition } from 'react';
import { WizardShell } from '@/components/onboarding/WizardShell';
import { ChipMultiSelect, ChipSingleSelect } from '@/components/onboarding/ChipMultiSelect';
import { Input, Select, Textarea } from '@/components/ui';
import { COUNTRIES, DEVICES, HOURS_OPTIONS, LANGUAGES, NICHES } from '@/lib/onboarding/catalog';
import { completeWorkerOnboarding } from '@/lib/auth/actions';

export default function WorkerOnboardingPage() {
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  // Step 1
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  // Step 3
  const [languages, setLanguages] = useState<string[]>([]);

  // Step 4
  const [niches, setNiches] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [hours, setHours] = useState<string | null>(null);

  // Step 5
  const [shortBio, setShortBio] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canContinue = (() => {
    if (step === 0) return fullName.length > 1 && country.length > 0 && stateRegion.length > 0 && city.length > 0;
    if (step === 1) return dateOfBirth.length > 0 && gender.length > 0;
    if (step === 2) return languages.length > 0;
    if (step === 3) return niches.length > 0 && devices.length > 0 && !!hours;
    if (step === 4) return true; // bio is optional
    return false;
  })();

  const continueOrSubmit = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    const form = new FormData();
    form.set('full_name', fullName);
    form.set('country', country);
    form.set('state_region', stateRegion);
    form.set('city', city);
    form.set('phone', phone);
    form.set('date_of_birth', dateOfBirth);
    form.set('gender', gender);
    languages.forEach((l) => form.append('languages', l));
    niches.forEach((n) => form.append('niches', n));
    devices.forEach((d) => form.append('devices', d));
    if (hours) form.set('hours_per_day_available', hours);
    form.set('short_bio', shortBio);

    setSubmitting(true);
    setSubmitError(null);
    startTransition(async () => {
      const result = await completeWorkerOnboarding(form);
      if (result && 'error' in result) {
        setSubmitError(humanise(result.error));
        setSubmitting(false);
      }
    });
  };

  const TITLES = [
    'Where are you based?',
    "When were you born?",
    'Languages you speak',
    'Your interests',
    'A short bio (optional)',
  ];
  const DESCRIPTIONS = [
    "Creators target audiences by location — yours unlocks more tasks.",
    'We need this to make sure all workers are 18 or older.',
    'You only get tasks for content in languages you can actually evaluate.',
    'Pick the niches you genuinely enjoy. Those are the videos you\'ll be asked to watch.',
    'Tell creators a bit about yourself. Helps build trust on cross-promotion campaigns.',
  ];

  return (
    <WizardShell
      step={step}
      steps={5}
      title={TITLES[step]}
      description={DESCRIPTIONS[step]}
      onBack={() => setStep(Math.max(0, step - 1))}
      onContinue={continueOrSubmit}
      continueDisabled={!canContinue || submitting}
      continueLoading={submitting}
      continueLabel={step === 4 ? 'Finish setup' : undefined}
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
          <Select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={COUNTRIES}
            placeholder="Pick your country"
            required
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="State or region"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              required
              placeholder="e.g. Lagos, Maharashtra, Selangor"
            />
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="City"
            />
          </div>
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+234 …"
            helper="Used for security alerts. We never share it with creators."
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Input
            type="date"
            label="Date of birth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            helper="Workers must be 18 or older."
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: 'male',                label: 'Male' },
              { value: 'female',              label: 'Female' },
              { value: 'nonbinary',           label: 'Non-binary' },
              { value: 'prefer_not_to_say',   label: 'Prefer not to say' },
            ]}
            placeholder="Select"
            required
            helper="Helps creators reach the right audience demographic for their study."
          />
        </div>
      )}

      {step === 2 && (
        <FieldGroup label="Pick every language you can read + watch comfortably" helper="Multi-select." required>
          <ChipMultiSelect options={LANGUAGES} value={languages} onChange={setLanguages} />
        </FieldGroup>
      )}

      {step === 3 && (
        <div className="space-y-7">
          <FieldGroup label="Niches you genuinely enjoy watching" helper="Multi-select. Pick at least one." required>
            <ChipMultiSelect options={NICHES} value={niches} onChange={setNiches} />
          </FieldGroup>
          <FieldGroup label="Devices you'll use to complete tasks" helper="Multi-select." required>
            <ChipMultiSelect options={DEVICES} value={devices} onChange={setDevices} />
          </FieldGroup>
          <FieldGroup label="Hours per day you can work" required>
            <ChipSingleSelect options={HOURS_OPTIONS} value={hours} onChange={setHours} />
          </FieldGroup>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <Textarea
            label="A few sentences about yourself (optional)"
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            placeholder="Where you're from, what you like watching, why you'd be a good audience for creators…"
            rows={4}
            helper="Shown only on Collab and Promote pages — not on Insights/AB tests."
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

function humanise(code: string): string {
  switch (code) {
    case 'not_authenticated': return 'Your session expired. Log in again.';
    case 'country_required':  return 'Pick a country to continue.';
    case 'dob_required':      return 'Date of birth is required.';
    case 'languages_required':return 'Pick at least one language.';
    case 'niches_required':   return 'Pick at least one niche.';
    case 'must_be_18':        return 'You must be 18 or older to be a worker on Highzcore.';
    default:                  return 'Something went wrong. Try again.';
  }
}
