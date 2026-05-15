// Reusable country landing page. Each country gets a thin variant of the
// homepage with localised hero copy + a localised stats band.

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MarketingLayout } from './MarketingLayout';
import { Hero, Reveal, SectionHeading } from './sections';
import { Card, LinkButton } from '@/components/ui';

export interface CountryPageProps {
  countryCode: string;       // ISO 3166-1 alpha-2 — 'NG', 'IN', etc.
  countryName: string;       // "Nigeria"
  callout: string;           // "Built for Nigerian creators."
  language?: string;         // primary language label
  highlightCreators: string;
  highlightWorkers: string;
  topNiches: string[];
}

export function CountryPage(p: CountryPageProps) {
  return (
    <MarketingLayout>
      <Hero
        eyebrow={`For creators + workers in ${p.countryName}`}
        title={<>{p.callout}<br /><span className="text-fg-muted">Honest data. Real growth.</span></>}
        description={
          <>
            Highzcore is a creator growth platform for YouTube creators in {p.countryName} stuck
            in the 0–100k subscriber zone — uploading regularly, not growing as fast as they\'d
            like, and tired of generic advice.
          </>
        }
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started — free
            </LinkButton>
            <LinkButton href="/products/insights" size="lg" variant="secondary">
              See how Insights works
            </LinkButton>
          </>
        }
      />

      <Reveal>
        <SectionHeading
          eyebrow={`Why ${p.countryName}`}
          title={`Built around how creators here actually grow.`}
        />
        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-[1100px]">
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">For creators</p>
            <h3 className="mt-2 text-2xl font-semibold text-fg">{p.highlightCreators}</h3>
            <p className="mt-3 text-base text-fg-muted leading-relaxed">
              Target audiences in {p.countryName} specifically when running Insights or ABTest. The
              panel matches your real subscribers — same country, same language{p.language ? ` (${p.language})` : ''}, same niche.
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">For workers</p>
            <h3 className="mt-2 text-2xl font-semibold text-fg">{p.highlightWorkers}</h3>
            <p className="mt-3 text-base text-fg-muted leading-relaxed">
              Withdraw earnings as USDT TRC20 from $10. Flat $1 fee, on-chain tx. Same payout for
              all workers globally — no country-based discrimination.
            </p>
          </Card>
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Most-served niches here" title={`Top niches with workers + creators in ${p.countryName}.`} />
        <div className="mt-12 flex flex-wrap gap-2 max-w-[800px]">
          {p.topNiches.map((n) => (
            <span
              key={n}
              className="inline-flex items-center h-9 px-4 rounded-full border border-border bg-surface text-sm font-medium text-fg"
            >
              {n}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Ready to start?
          </h2>
          <p className="mt-4 text-base text-fg-muted">
            Pick a side. You can always add the other role later.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/signup/creator" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up as a creator
            </LinkButton>
            <LinkButton href="/signup/worker" size="lg" variant="secondary">
              Sign up as a worker
            </LinkButton>
          </div>
          <p className="mt-6 text-sm text-fg-muted">
            See all <Link href="/compare" className="text-brand font-semibold">comparisons</Link> or{' '}
            <Link href="/pricing" className="text-brand font-semibold">pricing</Link>.
          </p>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
