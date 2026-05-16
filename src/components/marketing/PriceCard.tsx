// Reusable pricing card used by /pricing and the product pages.
// Wraps PremiumCard for the gradient border + spotlight feel; highlight
// tier gets a brand-glow ring + accent CTA.

import { Check } from 'lucide-react';
import Link from 'next/link';
import { PremiumCard } from './PremiumCard';
import { cn } from '@/lib/utils';

export interface PriceCardProps {
  label: string;
  priceUsd: number;
  perUnit: string;          // e.g. "50 responses", "30 votes"
  features: string[];
  ctaHref: string;
  ctaLabel?: string;
  highlight?: string;       // optional pill label ("Most popular")
  className?: string;
}

export function PriceCard({
  label,
  priceUsd,
  perUnit,
  features,
  ctaHref,
  ctaLabel = 'Get started',
  highlight,
  className,
}: PriceCardProps) {
  return (
    <PremiumCard className={cn('h-full', className)} highlight={!!highlight}>
      <div className="p-6 md:p-7 flex flex-col h-full">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-fg">{label}</h3>
          {highlight && (
            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
              {highlight}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-fg-muted">{perUnit}</p>
        <p className="mt-4 flex items-baseline gap-1">
          <span className="font-mono tabular text-5xl md:text-6xl font-extrabold tracking-tight text-fg">
            ${priceUsd}
          </span>
          <span className="text-sm text-fg-subtle">USD</span>
        </p>
        <ul className="mt-5 md:mt-6 space-y-2 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-fg-muted">
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link
            href={ctaHref}
            className={cn(
              'inline-flex h-11 w-full items-center justify-center rounded-md px-6 text-sm font-semibold transition-all',
              highlight
                ? 'bg-brand text-brand-fg hover:bg-brand-hover shadow-[0_4px_24px_-4px_color-mix(in_srgb,var(--c-brand)_40%,transparent)] hover:shadow-[0_8px_32px_-4px_color-mix(in_srgb,var(--c-brand)_60%,transparent)]'
                : 'bg-surface/70 border border-border text-fg hover:bg-surface-hover',
            )}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </PremiumCard>
  );
}
