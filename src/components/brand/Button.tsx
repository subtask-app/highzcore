// Canonical brand button. Use this for every primary/secondary CTA going
// forward so we stop reinventing the same `bg-gradient-to-br ...` classes
// in every component.
//
// Sizes are tuned for mobile-first (≥ 44px tap target on `md` and `lg`).

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;        // full-width
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLS: Record<Variant, string> = {
  // Brand gradient — cyan→blue. Same shape as marketing-page primary CTAs.
  primary:
    'bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white shadow-[0_12px_28px_-10px_rgba(59,130,246,0.55)] hover:shadow-[0_14px_32px_-8px_rgba(34,211,238,0.55)] active:translate-y-px',
  // Quiet, lives inside cards / next to primary buttons.
  secondary:
    'bg-white/8 hover:bg-white/15 text-white border border-white/10 hover:border-white/25 active:translate-y-px',
  // Text-only. Use for inline "cancel" / "later".
  ghost:
    'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
  // Destructive — withdraw, delete, etc.
  danger:
    'bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-[0_12px_28px_-10px_rgba(244,63,94,0.55)] active:translate-y-px',
  // Success / verified states.
  success:
    'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_12px_28px_-10px_rgba(16,185,129,0.5)] active:translate-y-px',
};

const SIZE_CLS: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',          // 44px — Apple-recommended tap target
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',        // 48px — phat phone-friendly hero CTAs
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', block, loading, leadingIcon, trailingIcon, disabled, className = '', children, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold whitespace-nowrap transition cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
      ) : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});

export default Button;
