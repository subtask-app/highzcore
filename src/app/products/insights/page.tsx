import Link from 'next/link';
import { ArrowRight, BarChart3, Clock, MessageSquareHeart, ShieldCheck, Target, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { PriceCard } from '@/components/marketing/PriceCard';
import { Card, LinkButton, ProductBadge } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema, insightsServiceSchema } from '@/components/seo/structured-data';
import { INSIGHTS_TIERS, feeBreakdown } from '@/lib/insights/pricing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Audience Insights — pre-publication YouTube video feedback',
  description:
    "Real people in your target demographic watch your YouTube video and answer structured questions before you publish. Get sub-likelihood, retention drop-offs, and verbatim feedback in under 24 hours.",
  alternates: { canonical: '/products/insights' },
};

const FAQS = [
  {
    q: "How is this different from YouTube Studio analytics?",
    a: "YouTube Studio shows you what happened after you published. Audience Insights tells you what would happen before you publish — so you can fix the title, thumbnail, hook, or pacing while it still matters.",
  },
  {
    q: "Who are the workers?",
    a: "Real adults across Nigeria, India, Indonesia, Malaysia, Singapore, Ghana, and more. You filter by country, language, niche, age, and gender so the panel matches your actual audience, not random viewers.",
  },
  {
    q: "How long does a study take to fill?",
    a: "Starter (50 responses) usually fills in 6–12 hours. Growth (200) in 12–24 hours. Pro (1,000) in 24–72 hours. We text you when it's done.",
  },
  {
    q: "Can I write my own questions?",
    a: "Yes. The default 6-question set works for most videos, but you can replace any or all of them with custom questions: multiple choice, short text, long text, 1–5 rating, or timestamp picker.",
  },
  {
    q: "Do workers actually watch the video?",
    a: "Yes — we track real PLAYING time inside our embedded player, and require workers to watch at least 60% (capped at 5 minutes) before they can submit. Tab-visibility is also tracked.",
  },
  {
    q: "Is the worker pool the same as my actual audience?",
    a: "Not necessarily — but you target by demographics that resemble your actual audience. The more specific your targeting (country + language + niches), the closer the panel gets.",
  },
];

const FEATURES = [
  { icon: <Target className="h-6 w-6" strokeWidth={1.5} />,             title: 'Targeting that matches your real audience', description: 'Country, language, niche, gender, age — match the demographic you actually publish for.' },
  { icon: <MessageSquareHeart className="h-6 w-6" strokeWidth={1.5} />, title: '6 question types',                          description: 'Multiple choice, short and long text, 1–5 rating, timestamp picker — combined into one report.' },
  { icon: <Clock className="h-6 w-6" strokeWidth={1.5} />,              title: 'First responses in 30 minutes',             description: 'Studies launch instantly. Most fill within 24 hours; you can preview responses as they arrive.' },
  { icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />,        title: 'Anti-rush watch gate',                      description: "Workers must watch ≥ 60% (capped at 5 min) before submitting. Tab visibility and play time tracked." },
  { icon: <BarChart3 className="h-6 w-6" strokeWidth={1.5} />,          title: 'Aggregate + verbatim report',               description: 'Bar charts, rating histogram, drop-off heatmap, and the full text of every written answer.' },
  { icon: <Users className="h-6 w-6" strokeWidth={1.5} />,              title: 'Pre-publication, every time',               description: "Test the title, thumbnail, hook, and pacing before they're locked in. Save bad videos before they ship." },
];

export default function InsightsProductPage() {
  return (
    <MarketingLayout>
      <JsonLd data={insightsServiceSchema(SITE_URL)} />
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Audience Insights', url: `${SITE_URL}/products/insights` },
      ])} />

      <Hero
        eyebrow="Audience Insights"
        title={<>Find out what your<br /><span className="text-fg-muted">audience really thinks.</span></>}
        description={
          <>
            Real people in your target demographic watch your YouTube video and tell you why it\'s
            not landing — <span className="font-semibold text-fg">before you publish</span>.
          </>
        }
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start a study — $50
            </LinkButton>
            <LinkButton href="#how" size="lg" variant="secondary">
              See how it works
            </LinkButton>
          </>
        }
      />

      <div className="mx-auto mb-16 max-w-[1100px] px-4 md:px-8">
        <Card padding="lg" className="text-center">
          <ProductBadge product="insights" size="xl" className="mx-auto" />
          <p className="mt-4 text-base md:text-lg text-fg-muted max-w-[700px] mx-auto leading-relaxed">
            What every creator wishes they had before hitting publish: 50–1,000 honest responses
            from people who match their actual audience, in under a day.
          </p>
        </Card>
      </div>

      <Reveal id="how">
        <SectionHeading align="center" eyebrow="How it works" title="Three steps." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {[
            { n: '1', title: 'Upload your video',  desc: 'Paste the YouTube URL — we fetch the title, thumbnail, and duration. Public + embeddable required.' },
            { n: '2', title: 'Pick your panel',    desc: 'Country, language, niche, age, gender. Tighter targeting = sharper signal.' },
            { n: '3', title: 'Read the report',    desc: 'Watch responses arrive in real time. Aggregate bars, rating histogram, drop-off heatmap, full quotes.' },
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
        <SectionHeading eyebrow="What's in every study" title="Built so the data is honest." />
        <FeatureGrid items={FEATURES} />
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="Pricing" title="Pay per study. No subscription." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {INSIGHTS_TIERS.map((t) => {
            const bd = feeBreakdown(t.totalUsd, t.responseCount);
            return (
              <PriceCard
                key={t.id}
                label={t.label}
                priceUsd={t.totalUsd}
                perUnit={`${t.responseCount.toLocaleString()} responses`}
                features={[
                  `Worker payout: $${bd.perTask.toFixed(2)} per response`,
                  'Drop-off heatmap + rating histogram',
                  'Full verbatim quotes',
                  'Demographics breakdown',
                  t.id === 'pro' ? 'Priority support' : 'Email + Telegram updates',
                ]}
                ctaHref="/signup"
                ctaLabel="Start a study"
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
            Stop publishing videos<br />
            <span className="text-brand">you\'re not sure about.</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start your first study
            </LinkButton>
            <Link href="/products/abtest" className="text-sm font-semibold text-fg-muted hover:text-fg">
              Or test a thumbnail →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
