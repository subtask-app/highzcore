import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { PriceCard } from '@/components/marketing/PriceCard';
import { LinkButton, ProductBadge } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';
import { INSIGHTS_TIERS } from '@/lib/insights/pricing';
import { ABTEST_TIERS } from '@/lib/abtest/pricing';
import { PROMOTE_TIERS } from '@/lib/promote/pricing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Pricing — Highzcore',
  description: 'Pay per project, no subscription. Insights from $50, AB tests from $10, Promote from $35, Collab fees 15% per side.',
  alternates: { canonical: '/pricing' },
};

const FAQS = [
  { q: 'Is there a subscription?', a: 'No. Pay per project. You can run one Insights study a year or twenty.' },
  { q: 'What payment methods do you accept?', a: 'Card via Flutterwave (international cards welcome), USDT via CCPayment, or direct bank transfer.' },
  { q: 'How much of my payment goes to workers?', a: '70% goes to the worker pool, 30% is the platform fee. Collab is split 15% per side.' },
  { q: 'Can I get a refund if my project doesn\'t fill?', a: "Yes. If your project doesn't reach its target response count within 7 days, the unfilled portion is refunded. Reach support and we'll process it." },
  { q: 'Do you offer volume discounts?', a: 'The bigger tiers already include effective volume pricing (per-response cost drops at higher tiers). For very high volume needs, reach out.' },
];

export default function PricingPage() {
  return (
    <MarketingLayout>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Pricing', url: `${SITE_URL}/pricing` },
      ])} />

      <Hero
        eyebrow="Pricing"
        title={<>Pay per project.<br /><span className="text-fg-muted">No subscription.</span></>}
        description="Every project. Every product. Listed at the price you actually pay. 70% goes to workers."
      />

      <Reveal>
        <div className="flex items-center gap-3 mb-8">
          <ProductBadge product="insights" size="md" />
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">Audience Insights</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {INSIGHTS_TIERS.map((t) => (
            <PriceCard
              key={t.id}
              label={t.label}
              priceUsd={t.totalUsd}
              perUnit={`${t.responseCount.toLocaleString()} responses`}
              features={['Drop-off heatmap', 'Rating histogram', 'Verbatim quotes', 'Demographics breakdown']}
              ctaHref="/signup"
              ctaLabel="Start a study"
              highlight={t.highlight}
            />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center gap-3 mb-8">
          <ProductBadge product="abtest" size="md" />
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">Thumbnail &amp; Title Testing</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {ABTEST_TIERS.map((t) => (
            <PriceCard
              key={t.id}
              label={t.label}
              priceUsd={t.totalUsd}
              perUnit={`${t.voteCount.toLocaleString()} votes`}
              features={['2–4 variants', 'Wilson 95% CI winner', 'Demographics breakdown', 'Optional voter reasons']}
              ctaHref="/signup"
              ctaLabel="Run a test"
              highlight={t.highlight}
            />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center gap-3 mb-8">
          <ProductBadge product="promote" size="md" />
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">Promote</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PROMOTE_TIERS.map((t) => (
            <PriceCard
              key={t.id}
              label={t.label}
              priceUsd={t.totalUsd}
              perUnit={`${t.shareCount} shares`}
              features={['Verified audience match', 'UTM tracking in YouTube Studio', 'Admin-reviewed', '7 platforms']}
              ctaHref="/signup"
              ctaLabel="Launch a campaign"
              highlight={t.highlight}
            />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center gap-3 mb-8">
          <ProductBadge product="collab" size="md" />
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">Collab Matchmaking</h2>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8 md:p-12">
          <p className="font-mono tabular text-5xl font-extrabold text-fg">15%</p>
          <p className="mt-2 text-base text-fg-muted">platform fee per side</p>
          <p className="mt-4 text-base text-fg-muted leading-relaxed max-w-2xl">
            Each creator pays 15% of the agreed escrow amount. No fixed price — pick whatever
            escrow level you and the other creator agree on, from $5 to $5,000 per side.
          </p>
          <div className="mt-6">
            <LinkButton href="/products/collab" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              How Collab works
            </LinkButton>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="Common questions" title="Pricing FAQ" />
        <div className="mt-12 max-w-[760px] mx-auto"><FaqBlock items={FAQS} /></div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Start with $10.<br /><span className="text-brand">Stay because it works.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up free
            </LinkButton>
            <Link href="/contact" className="text-sm font-semibold text-fg-muted hover:text-fg">
              Need volume pricing? Contact us →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
