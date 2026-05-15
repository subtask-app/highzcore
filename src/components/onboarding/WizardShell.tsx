// Onboarding wizard shell — header with progress, body slot, footer with
// back / continue buttons. Used by both creator and worker wizards.

import { type ReactNode } from 'react';
import Logo from '@/components/brand/Logo';
import { ThemeQuickToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface WizardShellProps {
  /** Current step index (0-based). */
  step: number;
  /** Total number of steps in the flow. */
  steps: number;
  /** Big headline for this step. */
  title: string;
  /** One-sentence description. */
  description?: ReactNode;
  /** Back button visible only when step > 0; pressed to go back. */
  onBack?: () => void;
  /** Continue button label override. Default: "Continue". On last step, default: "Finish". */
  continueLabel?: string;
  /** Continue handler — fires when the user clicks Continue. Should validate + advance. */
  onContinue: () => void;
  /** When set, disables the Continue button (e.g. required fields missing). */
  continueDisabled?: boolean;
  /** When set, shows the Continue button in loading state. */
  continueLoading?: boolean;
  /** Optional "Skip this step" link rendered to the left of the buttons. */
  skipLabel?: string;
  onSkip?: () => void;
  className?: string;
  children: ReactNode;
}

export function WizardShell({
  step,
  steps,
  title,
  description,
  onBack,
  continueLabel,
  onContinue,
  continueDisabled,
  continueLoading,
  skipLabel,
  onSkip,
  className,
  children,
}: WizardShellProps) {
  const isLast = step === steps - 1;
  const label = continueLabel ?? (isLast ? 'Finish' : 'Continue');
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <header className="flex items-center gap-3 px-4 md:px-8 h-16">
        <Logo size="sm" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeQuickToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center px-4 py-6 md:py-12">
        <div className={cn('w-full max-w-2xl', className)}>
          <ProgressBar step={step} steps={steps} />
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-fg leading-tight mt-8">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-base md:text-lg text-fg-muted leading-relaxed max-w-xl">
              {description}
            </p>
          )}
          <div className="mt-8 mb-24 md:mb-8">{children}</div>
        </div>
      </main>
      <footer
        className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-bg-elevated/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 md:px-0 h-16">
          {step > 0 && onBack ? (
            <Button type="button" variant="ghost" onClick={onBack} disabled={continueLoading}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {skipLabel && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={continueLoading}
              className="text-sm text-fg-muted hover:text-fg"
            >
              {skipLabel}
            </button>
          )}
          <div className="ml-auto">
            <Button onClick={onContinue} disabled={continueDisabled} loading={continueLoading}>
              {label}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProgressBar({ step, steps }: { step: number; steps: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: steps }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            i <= step ? 'bg-brand' : 'bg-surface-active',
          )}
        />
      ))}
      <span className="ml-3 text-xs font-semibold text-fg-subtle tabular shrink-0">
        Step {step + 1} of {steps}
      </span>
    </div>
  );
}
