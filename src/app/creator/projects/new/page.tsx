// /creator/projects/new — product picker. Five product cards. Each pushes
// to /creator/projects/new/{product} which the per-product milestone (M6–M9)
// owns. For M4, the destinations exist as "coming soon" stubs.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, ProductBadge, productLabel } from '@/components/ui';
import type { Product } from '@/components/ui';

export const metadata = {
  title: 'New project · Highzcore',
};

interface Pitch {
  product: Product;
  pitch: string;
  bullets: string[];
  priceFrom: string;
  badge?: string;
}

const PITCHES: Pitch[] = [
  {
    product: 'insights',
    pitch: 'Find out what your audience really thinks of your video before you publish.',
    bullets: ['50–1000 honest responses', 'Drop-off heatmap + quotes', 'Demographic breakdown'],
    priceFrom: '$50',
    badge: 'Most popular',
  },
  {
    product: 'abtest',
    pitch: 'Test thumbnail or title variants against your target audience.',
    bullets: ['Side-by-side click test', 'Statistical winner with confidence', 'Results in under an hour'],
    priceFrom: '$10',
  },
  {
    product: 'promote',
    pitch: "Share your video to real audiences on Twitter, IG, TikTok, Telegram.",
    bullets: ['Verified follower counts', 'Click + reach tracked via UTM', 'Pay only for delivered shares'],
    priceFrom: '$30',
  },
  {
    product: 'collab',
    pitch: 'Find creators in your niche for cross-promotion or joint videos.',
    bullets: ['Niche + audience-size matched', 'Two-sided escrow', '15% platform fee'],
    priceFrom: '$0',
  },
];

export default function NewProjectPickerPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Start a project</p>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-fg leading-tight">
          What does your channel need today?
        </h1>
        <p className="text-base md:text-lg text-fg-muted leading-relaxed">
          Pick the kind of project to start. You can always change your mind before paying.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {PITCHES.map((p) => (
          <Link key={p.product} href={`/creator/projects/new/${p.product}`} className="block">
            <Card variant="interactive" padding="lg" className="flex flex-col h-full">
              <div className="flex items-start gap-4">
                <ProductBadge product={p.product} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-fg">
                      {productLabel(p.product)}
                    </h2>
                    {p.badge && (
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-fg-muted leading-relaxed">{p.pitch}</p>
                </div>
              </div>

              <ul className="mt-5 space-y-1.5">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="inline-block h-1 w-1 rounded-full bg-brand" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className="text-sm text-fg-subtle">
                  From <span className="text-fg font-semibold tabular">{p.priceFrom}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-sm text-fg-muted leading-relaxed text-center max-w-xl mx-auto">
        Not sure which one? Most creators start with{' '}
        <Link href="/creator/projects/new/insights" className="text-brand font-semibold">Audience Insights</Link>
        {' '}— it tells you whether your title, thumbnail, and hook are working, before you waste a publish on it.
      </p>
    </div>
  );
}
