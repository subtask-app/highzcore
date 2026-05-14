// THE canonical Highzcore logo. Use this — and only this — everywhere a logo
// is shown (marketing, auth pages, dashboards, emails-as-rendered-HTML, etc.).
//
// Design:
//   • Icon: rounded square with a cyan→blue gradient, white play-triangle
//     centered, a small "+" growth pip at the top-right corner.
//   • Wordmark: "Highzcore" set in the body font weight 900.
//
// Variants:
//   • `<Logo />`                — full lockup (icon + wordmark)
//   • `<Logo iconOnly />`       — icon only (tight nav spots, favicons)
//   • size knobs via the props below — keep usage uniform across pages.

import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<Size, string> = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};
const WORD_SIZE: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};
const GAP: Record<Size, string> = {
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-3',
};
const PLAY_SCALE: Record<Size, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

interface LogoProps {
  size?: Size;
  iconOnly?: boolean;
  href?: string | null;        // pass `null` for static (e.g. on dashboards inside their own logo block)
  className?: string;
  /** Hide the soft outer glow (good on busy / 3D backgrounds where it adds noise). */
  noGlow?: boolean;
}

function LogoIcon({ size, noGlow }: { size: Size; noGlow: boolean }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${ICON_SIZE[size]} bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_4px_18px_-2px_rgba(96,165,250,0.45)] ${noGlow ? '' : 'ring-1 ring-white/10'}`}>
      {/* play triangle */}
      <svg viewBox="0 0 24 24" fill="none" className={`${PLAY_SCALE[size]} text-white drop-shadow-[0_1px_2px_rgba(2,6,23,0.5)]`} aria-hidden="true">
        <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor" />
      </svg>
      {/* growth pip — small + bg accent in the corner */}
      <span
        aria-hidden="true"
        className="absolute -top-1 -right-1 inline-flex items-center justify-center h-3 w-3 rounded-full bg-cyan-300 text-blue-950 text-[8px] font-black leading-none ring-2 ring-slate-950"
      >
        +
      </span>
    </span>
  );
}

export default function Logo({
  size = 'md',
  iconOnly = false,
  href = '/',
  className = '',
  noGlow = false,
}: LogoProps) {
  const content = (
    <span className={`inline-flex items-center ${GAP[size]} ${className}`}>
      <LogoIcon size={size} noGlow={noGlow} />
      {!iconOnly && (
        <span className={`font-black tracking-tight leading-none text-white ${WORD_SIZE[size]} font-display`}>
          Highzcore
        </span>
      )}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} aria-label="Highzcore home" className="inline-flex">
      {content}
    </Link>
  );
}
