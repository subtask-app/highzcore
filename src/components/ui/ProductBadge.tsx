// ProductBadge — square icon badge for each of the 5 products. Uses the
// product accent color from DESIGN.md. Appears in dashboard product pickers,
// task cards, and Telegram notifications (rendered as image elsewhere).

import { LayoutGrid, MessageSquareHeart, Megaphone, Rocket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Product = 'insights' | 'abtest' | 'promote' | 'collab' | 'boost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const ICONS: Record<Product, typeof Users> = {
  insights: MessageSquareHeart,
  abtest:   LayoutGrid,
  promote:  Megaphone,
  collab:   Users,
  boost:    Rocket,
};

// Tailwind doesn't statically know our product accent CSS vars, so we wire
// them in via inline CSS variables on each badge.
const ACCENTS: Record<Product, string> = {
  insights: 'var(--c-product-insights)',
  abtest:   'var(--c-product-abtest)',
  promote:  'var(--c-product-promote)',
  collab:   'var(--c-product-collab)',
  boost:    'var(--c-product-boost)',
};

const LABELS: Record<Product, string> = {
  insights: 'Audience Insights',
  abtest:   'Thumbnail & Title Testing',
  promote:  'Promote',
  collab:   'Collab',
  boost:    'Boost',
};

const SIZES: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'h-8 w-8 rounded-md',       icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10 rounded-md',     icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14 rounded-lg',     icon: 'h-7 w-7' },
  xl: { box: 'h-20 w-20 rounded-xl',     icon: 'h-10 w-10' },
};

export interface ProductBadgeProps {
  product: Product;
  size?: Size;
  ariaLabel?: string;
  className?: string;
}

export function ProductBadge({ product, size = 'md', ariaLabel, className }: ProductBadgeProps) {
  const Icon = ICONS[product];
  const accent = ACCENTS[product];
  const { box, icon } = SIZES[size];
  return (
    <span
      role="img"
      aria-label={ariaLabel ?? LABELS[product]}
      className={cn(
        'inline-flex items-center justify-center shrink-0 ring-1',
        box,
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
        ['--ring-color' as never]: `color-mix(in srgb, ${accent} 8%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 8%, transparent)`,
        color: accent,
      }}
    >
      <Icon className={icon} strokeWidth={1.5} />
    </span>
  );
}

export function productLabel(p: Product): string {
  return LABELS[p];
}
