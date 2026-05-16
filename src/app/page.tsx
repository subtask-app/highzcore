// Homepage — Apple-style story flow. Server-rendered so search engines see
// every section; client islands only where reveal animations need them.

import Link from 'next/link';
import { ArrowRight, BarChart3, Handshake, Layers, LayoutGrid, MessageSquareHeart, Megaphone, ShieldCheck, Star, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { PremiumCard } from '@/components/marketing/PremiumCard';
import { Card, LinkButton, ProductBadge, productLabel } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { faqSchema, organizationSchema, websiteSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Highzcore — Real audience feedback, before you publish',
  description:
    "Real people in your target audience watch your YouTube video and tell you why it's not landing — before you publish. Plus thumbnail testing, audience-driven promotion, and creator collabs. From $10.",
  alternates: { canonical: '/' },
};

const PRODUCTS = [
  {
    product: 'insights' as const,
    pitch: "Real people in your target audience watch your video and tell you exactly why it's not landing — before you publish.",
    bullets: ['50–1,000 honest responses', 'Drop-off heatmap + verbatim quotes', 'From $50 · ready in <24h'],
  },
  {
    product: 'abtest' as const,
    pitch: 'Side-by-side click-test 2–4 thumbnails or titles against your actual audience.',
    bullets: ['Statistically significant winner', 'Demographics breakdown', 'From $10 · results in <1h'],
  },
  {
    product: 'promote' as const,
    pitch: 'Workers with verified follower counts share your video to their real audiences on X, Instagram, TikTok, Telegram + more.',
    bullets: ['Verified follower counts', 'UTM-tracked clicks in YouTube Studio', 'From $30'],
  },
  {
    product: 'collab' as const,
    pitch: 'Find another creator in your niche for a shoutout, joint video, live stream, or channel feature.',
    bullets: ['Niche + audience-size matched', 'Two-sided escrow', '15% per-side fee'],
  },
];

const FAQS = [
  {
    q: 'Is Highzcore the same as buying subscribers?',
    a: "No — we're the opposite. Sub services sell you a vanity number that tanks your channel because the algorithm sees the engagement gap. We sell honest pre-publication feedback so you make better videos that grow your channel naturally.",
  },
  {
    q: 'How fast do I get results?',
    a: 'Most studies get their first responses within 30 minutes of launch and fill in 6–24 hours depending on size. AB tests usually settle in under an hour.',
  },
  {
    q: 'Where are your workers from?',
    a: 'Workers are spread across Nigeria, India, Indonesia, Malaysia, Singapore, the Philippines, Ghana, Kenya, and a few other markets. You can filter by country and language when setting up a project.',
  },
  {
    q: 'How is this different from TubeBuddy or VidIQ?',
    a: 'TubeBuddy and VidIQ tell you what is happening to your channel based on your existing data. Highzcore tells you why — by getting real people in your target demographic to react to your content and explain their reactions.',
  },
  {
    q: 'How do I pay?',
    a: 'Card via Flutterwave (works for international cards), USDT via CCPayment, or direct bank transfer. No subscription — you pay per project.',
  },
  {
    q: "Is Highzcore compliant with YouTube's terms?",
    a: 'Yes. We never touch your YouTube account, never artificially inflate engagement, and never sell subscriptions or views. Our entire business model is selling diagnostic feedback, which YouTube actively supports.',
  },
];

export default function HomePage() {
  return (
    <MarketingLayout>
      <JsonLd data={organizationSchema(SITE_URL, 'Highzcore')} />
      <JsonLd data={websiteSchema(SITE_URL, 'Highzcore')} />
      <JsonLd data={faqSchema(FAQS)} />

      <Hero
        eyebrow="A creator growth platform"
        title={<>Real audiences.<br /><span className="text-fg-muted">Honest data.</span></>}
        description={
          <>
            Stop guessing why your videos don&apos;t grow. Real people in your target audience watch your YouTube video and tell you exactly why it&apos;s not landing —{' '}
            <span className="text-fg font-semibold">before you publish</span>.
          </>
        }
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start free
            </LinkButton>
            <LinkButton href="/products/insights" size="lg" variant="secondary">
              See how Insights works
            </LinkButton>
          </>
        }
      />

      <Reveal className="!py-8 md:!py-16" ambient={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-[1100px] mx-auto">
          {[
            { v: '$10',  l: 'Thumbnail tests from' },
            { v: '<24h', l: 'Typical turnaround' },
            { v: '6+',   l: 'Worker countries' },
            { v: '4',    l: 'Products, one platform' },
          ].map((s) => (
            <PremiumCard key={s.l} className="h-full" spotlight={false}>
              <div className="px-4 py-5 md:p-6 text-center">
                <p className="font-mono tabular text-3xl md:text-5xl font-extrabold tracking-tight text-fg">{s.v}</p>
                <p className="mt-1 text-xs md:text-sm text-fg-muted">{s.l}</p>
              </div>
            </PremiumCard>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading
          eyebrow="Four products, one platform"
          title={<>Built for creators<br />who hate guessing.</>}
          description="Every product hooks into the same worker pool — switch between products without switching tools."
        />
        <div className="mt-8 md:mt-12 grid md:grid-cols-2 gap-4">
          {PRODUCTS.map((p) => {
            const accent =
              p.product === 'insights' ? '#ff8a5c' :
              p.product === 'abtest'   ? '#a584ff' :
              p.product === 'promote'  ? '#5bd68c' :
              p.product === 'collab'   ? '#ffc857' :
              'var(--c-brand)';
            return (
              <PremiumCard key={p.product} href={`/products/${p.product}`} accent={accent} className="h-full">
                <div className="p-5 md:p-8 flex flex-col h-full">
                  <div className="flex items-start gap-4">
                    <ProductBadge product={p.product} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-fg">{productLabel(p.product)}</h3>
                      <p className="mt-2 text-sm md:text-base text-fg-muted leading-relaxed">{p.pitch}</p>
                    </div>
                  </div>
                  <ul className="mt-5 md:mt-6 space-y-1.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-fg-muted">
                        <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 md:mt-6 text-sm font-semibold inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5" style={{ color: accent }}>
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title={<>Three steps. Under an hour.</>}
        />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {[
            { Icon: Layers,    title: 'Pick a product',     desc: 'Insights, AB test, Promote, or Collab. Each takes 60 seconds to set up.' },
            { Icon: Users,     title: 'Target real people', desc: 'Country, language, niche, age, gender — match your actual audience.' },
            { Icon: BarChart3, title: 'Get your report',    desc: 'Structured aggregates + verbatim quotes. Drop-off heatmaps. Statistical winners.' },
          ].map(({ Icon, title, desc }, i) => (
            <Card key={title} padding="lg" className="relative">
              <span className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-fg font-bold text-sm">
                {i + 1}
              </span>
              <Icon className="h-7 w-7 text-brand mt-3" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-fg">{title}</h3>
              <p className="mt-2 text-sm text-fg-muted leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal className="!py-16 md:!py-24">
        <Card padding="xl" className="bg-gradient-to-br from-brand-tint to-transparent border-brand/30">
          <div className="max-w-[800px] mx-auto text-center">
            <ShieldCheck className="h-10 w-10 text-brand mx-auto" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
              Compliant. By design.
            </h2>
            <p className="mt-3 text-base md:text-lg text-fg-muted leading-relaxed">
              We never touch your YouTube account. We never artificially inflate engagement.
              We never sell subscriptions or views. Every product on Highzcore is built around
              one thing: helping you make better content that earns its own growth.
            </p>
            <p className="mt-4 text-sm text-fg-muted">
              <Link href="/compare/sub-services" className="text-brand font-semibold hover:underline">
                Why we&apos;re not a sub-service →
              </Link>
            </p>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">For workers</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
              Earn for your opinions.
            </h2>
            <p className="mt-4 text-base md:text-lg text-fg-muted leading-relaxed">
              Watch videos in niches you actually like. Answer a few thoughtful questions. Get paid
              in USDT, withdrawable from $10. No selling, no spam, no shady stuff.
            </p>
            <div className="mt-6">
              <LinkButton href="/for-workers" rightIcon={<ArrowRight className="h-4 w-4" />}>
                See how workers earn
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: MessageSquareHeart, label: 'Insights',   value: '$0.20–1' },
              { Icon: LayoutGrid,         label: 'AB tests',   value: '$0.25–0.35' },
              { Icon: Megaphone,          label: 'Promote',    value: '$2–3' },
              { Icon: Star,               label: 'Tier perks', value: 'Lower fees' },
            ].map(({ Icon, label, value }) => (
              <Card key={label} padding="md">
                <Icon className="h-5 w-5 text-brand" strokeWidth={1.5} />
                <p className="mt-2 text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</p>
                <p className="mt-1 text-2xl font-bold text-fg">{value}</p>
              </Card>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Card padding="xl" className="text-center">
          <Handshake className="h-10 w-10 text-brand mx-auto" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
            Found another creator you&apos;d love to work with?
          </h2>
          <p className="mt-3 max-w-[640px] mx-auto text-base text-fg-muted leading-relaxed">
            Browse the directory by niche + audience size. Propose a shoutout, joint video, joint
            live, or channel feature. Two-sided escrow keeps both creators honest.
          </p>
          <div className="mt-6">
            <LinkButton href="/products/collab" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              How Collab works
            </LinkButton>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Common questions"
          title="What creators ask before signing up"
        />
        <div className="mt-12 max-w-[760px] mx-auto">
          <FaqBlock items={FAQS} />
        </div>
        <p className="mt-8 text-center text-sm text-fg-muted">
          Still wondering something?{' '}
          <Link href="/help" className="text-brand font-semibold">Browse the help center</Link>{' '}or{' '}
          <Link href="/contact" className="text-brand font-semibold">contact us</Link>.
        </p>
      </Reveal>

      <Reveal className="!py-24 md:!py-32">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.02] text-fg">
            Make better videos.<br />
            <span className="text-brand">Stop guessing.</span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-fg-muted leading-relaxed">
            Your first Insights study costs $50, runs in under a day, and you can launch it in 5 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up — free
            </LinkButton>
            <LinkButton href="/pricing" size="lg" variant="secondary">
              See pricing
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
