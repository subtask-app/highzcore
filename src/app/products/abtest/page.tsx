import Link from 'next/link';
import { ArrowRight, BarChart3, LayoutGrid, MousePointerClick, Shuffle, Timer, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { PriceCard } from '@/components/marketing/PriceCard';
import { Card, LinkButton, ProductBadge } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { abtestServiceSchema, breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';
import { ABTEST_TIERS, feeBreakdown } from '@/lib/abtest/pricing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Thumbnail & Title A/B Testing for YouTube creators',
  description:
    'Side-by-side click-test 2–4 thumbnails or titles against your target audience. Get a statistically significant winner in under an hour, with demographic breakdown.',
  alternates: { canonical: '/products/abtest' },
};

const FAQS = [
  {
    q: 'Why click-test outside YouTube?',
    a: "YouTube's built-in thumbnail testing requires you to publish the video and burns real traffic on losing variants. Highzcore tests before publish, in under an hour, against a panel matched to your target demo.",
  },
  {
    q: 'How do you call a winner?',
    a: "We compute a Wilson 95% confidence interval for each variant's vote share. The winner is whichever variant's lower bound exceeds every other variant's upper bound. If no variant beats the others statistically, we tell you that too rather than pretending.",
  },
  {
    q: 'How long does a test take?',
    a: 'Quick (30 votes) usually finishes in 30–60 minutes. Standard (100) in 1–3 hours. Deep (300) in 3–8 hours.',
  },
  {
    q: 'Can I test more than two variants?',
    a: 'Up to four variants per test.',
  },
  {
    q: 'Are workers shown the variants in the same order?',
    a: 'No — variants are shuffled per worker to prevent positional bias.',
  },
  {
    q: 'Does this work for titles too?',
    a: 'Yes. Title tests show 2–4 title texts side by side (rendered like real YouTube thumbnails would be) and ask workers which they\'d click first.',
  },
];

const FEATURES = [
  { icon: <LayoutGrid className="h-6 w-6" strokeWidth={1.5} />,        title: 'Thumbnails or titles',           description: 'Two product modes in one. Test 2–4 thumbnail images or 2–4 title text variants.' },
  { icon: <Shuffle className="h-6 w-6" strokeWidth={1.5} />,           title: 'Random order per worker',         description: 'Variants are shuffled on each worker\'s screen so position never affects the outcome.' },
  { icon: <Timer className="h-6 w-6" strokeWidth={1.5} />,             title: 'Results in under an hour',        description: 'Most tests fill before you\'ve finished your second coffee. Big tests are done by lunch.' },
  { icon: <BarChart3 className="h-6 w-6" strokeWidth={1.5} />,         title: 'Wilson 95% confidence',           description: "Winner picked using Wilson lower-bound — robust at low sample sizes, where naive ranking lies." },
  { icon: <MousePointerClick className="h-6 w-6" strokeWidth={1.5} />, title: 'Optional reason per vote',        description: "Workers can leave a short why-I-picked-it note. The most useful feedback you'll get on a thumbnail." },
  { icon: <Users className="h-6 w-6" strokeWidth={1.5} />,             title: 'Targeted by demographic',         description: 'Same targeting filters as Insights — country, language, niche, age, gender.' },
];

export default function AbtestProductPage() {
  return (
    <MarketingLayout>
      <JsonLd data={abtestServiceSchema(SITE_URL)} />
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Thumbnail & Title Testing', url: `${SITE_URL}/products/abtest` },
      ])} />

      <Hero
        eyebrow="Thumbnail & Title Testing"
        title={<>Pick the winner.<br /><span className="text-fg-muted">Before you publish.</span></>}
        description={<>Click-test up to 4 thumbnails or titles against your target audience. Statistical winner in under an hour.</>}
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Run a test — $10
            </LinkButton>
            <LinkButton href="#how" size="lg" variant="secondary">
              How it works
            </LinkButton>
          </>
        }
      />

      <div className="mx-auto mb-16 max-w-[1100px] px-4 md:px-8">
        <Card padding="lg" className="text-center">
          <ProductBadge product="abtest" size="xl" className="mx-auto" />
          <p className="mt-4 text-base md:text-lg text-fg-muted max-w-[700px] mx-auto leading-relaxed">
            The fastest, cheapest way to find out which thumbnail or title makes people click.
            From $10. Wilson-CI math under the hood.
          </p>
        </Card>
      </div>

      <Reveal id="how">
        <SectionHeading align="center" eyebrow="How it works" title="Three steps." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {[
            { n: '1', title: 'Upload variants',  desc: '2–4 thumbnail images, or 2–4 title texts. We render them side-by-side in the worker UI.' },
            { n: '2', title: 'Workers click-test', desc: "Each worker sees the variants in randomized order and picks which they'd click. Optional reason captured." },
            { n: '3', title: 'Winner declared',   desc: "Wilson 95% confidence. If a variant statistically beats the others, you'll see a winner badge." },
          ].map(({ n, title, desc }) => (
            <Card key={n} padding="lg" className="relative">
              <span className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-fg font-bold text-sm">{n}</span>
              <h3 className="mt-3 text-lg font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm text-fg-muted leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="What you get" title="Cheap, fast, statistically honest." />
        <FeatureGrid items={FEATURES} />
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="Pricing" title="Pay per test." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {ABTEST_TIERS.map((t) => {
            const bd = feeBreakdown(t.totalUsd, t.voteCount);
            return (
              <PriceCard
                key={t.id}
                label={t.label}
                priceUsd={t.totalUsd}
                perUnit={`${t.voteCount.toLocaleString()} votes`}
                features={[
                  `Worker payout: $${bd.perTask.toFixed(2)} per vote`,
                  'Wilson 95% confidence interval',
                  'Demographic breakdown',
                  'Optional voter reasoning',
                ]}
                ctaHref="/signup"
                ctaLabel="Run this test"
                highlight={t.highlight}
              />
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="FAQ" title="Common questions" />
        <div className="mt-12 max-w-[760px] mx-auto">
          <FaqBlock items={FAQS} />
        </div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
            Don\'t publish a thumbnail<br /><span className="text-brand">you haven\'t tested.</span>
          </h2>
          <div className="mt-8">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Run your first test
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
