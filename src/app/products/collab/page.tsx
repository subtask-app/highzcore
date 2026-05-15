import Link from 'next/link';
import { ArrowRight, CheckCircle2, Handshake, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { Card, LinkButton, ProductBadge } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, collabServiceSchema, faqSchema } from '@/components/seo/structured-data';
import { COLLAB_KIND_DESCRIPTION, COLLAB_KIND_LABEL, ESCROW_PRESETS } from '@/lib/collab/pricing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Collab Matchmaking for YouTube creators — shoutouts, joint videos, live streams',
  description:
    "Find creators in your niche for shoutouts, joint videos, joint live streams, or channel features. Two-sided escrow keeps both sides honest; 15% per-side platform fee.",
  alternates: { canonical: '/products/collab' },
};

const FAQS = [
  {
    q: 'Why do I need a platform for this?',
    a: "You don't strictly need one — but a platform handles the awkward parts: finding matches in your niche, agreeing terms, locking in escrow so neither side ghosts, and confirming completion. Without that, half of casual collab plans fall apart.",
  },
  {
    q: 'How does the escrow work?',
    a: "Each creator puts up the agreed amount into escrow at proposal time (creator A) and acceptance time (creator B). When both creators confirm the collab happened, escrow is released back to both — minus 15% per side platform fee.",
  },
  {
    q: 'What kinds of collabs are supported?',
    a: 'Shoutout, joint video, joint live stream, or channel feature. The four most common formats. The proposed_terms field is freeform so you can specify exactly what each side delivers.',
  },
  {
    q: "What if one creator doesn't deliver?",
    a: 'Each side has a Confirm Complete button. If only one side confirms, the project sits in pending. Admins can review and resolve as a dispute — refunds, partial releases, or extending the deadline.',
  },
  {
    q: 'How do I find someone in my niche?',
    a: 'The directory lets you filter by niche and subscriber bracket. We show every creator who\'s onboarded with a verified channel.',
  },
  {
    q: "What if I'm a smaller creator?",
    a: 'Set a low escrow ($5–$20) and propose to other small creators. Most collabs at this stage are between creators with similar audience sizes — that\'s how they grow each other.',
  },
];

const FEATURES = [
  { icon: <Target className="h-6 w-6" strokeWidth={1.5} />,       title: 'Niche + size matched directory',  description: 'Browse creators by niche, subscriber bracket, country, language. No spam from out-of-niche creators.' },
  { icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />,  title: 'Two-sided escrow',                description: "Both creators put up the agreed amount. Released only when both confirm completion. No more ghosting." },
  { icon: <Handshake className="h-6 w-6" strokeWidth={1.5} />,    title: 'Four collab formats',             description: 'Shoutout, joint video, joint live stream, channel feature. Pick the one that fits.' },
  { icon: <Sparkles className="h-6 w-6" strokeWidth={1.5} />,     title: 'Freeform terms',                  description: 'Spell out exactly what each side does — copy, links, deadlines — in the proposal.' },
  { icon: <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />, title: 'Per-side confirmation',           description: "Each creator confirms they delivered. When both confirm, escrow releases. If one ghosts, dispute path." },
  { icon: <Users className="h-6 w-6" strokeWidth={1.5} />,        title: 'No workers involved',             description: "Pure creator-to-creator. We're just the matchmaker + escrow + dispute resolver." },
];

export default function CollabProductPage() {
  return (
    <MarketingLayout>
      <JsonLd data={collabServiceSchema(SITE_URL)} />
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Collab', url: `${SITE_URL}/products/collab` },
      ])} />

      <Hero
        eyebrow="Collab Matchmaking"
        title={<>Cross-promote.<br /><span className="text-fg-muted">Without the ghosting.</span></>}
        description={<>Find creators in your niche for collabs, lock terms with two-sided escrow, and grow each other.</>}
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Browse the directory
            </LinkButton>
            <LinkButton href="#how" size="lg" variant="secondary">
              How it works
            </LinkButton>
          </>
        }
      />

      <div className="mx-auto mb-16 max-w-[1100px] px-4 md:px-8">
        <Card padding="lg" className="text-center">
          <ProductBadge product="collab" size="xl" className="mx-auto" />
          <p className="mt-4 text-base md:text-lg text-fg-muted max-w-[700px] mx-auto leading-relaxed">
            The grown-up version of finding collabs in the DMs. Niche-matched directory, two-sided
            escrow, four supported formats, dispute resolution if it gets messy.
          </p>
        </Card>
      </div>

      <Reveal id="how">
        <SectionHeading align="center" eyebrow="How it works" title="Five steps." />
        <div className="mt-12 grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-[1280px] mx-auto">
          {[
            { n: '1', title: 'Browse', desc: 'Filter by niche + audience size.' },
            { n: '2', title: 'Propose', desc: 'Pick the type. Write terms. Set escrow.' },
            { n: '3', title: 'Pay your half', desc: 'Escrow locked.' },
            { n: '4', title: 'They accept', desc: 'They pay their half. Both escrow live.' },
            { n: '5', title: 'Deliver + confirm', desc: 'When both confirm, escrow releases.' },
          ].map(({ n, title, desc }) => (
            <Card key={n} padding="md" className="relative">
              <span className="absolute -top-3 left-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-fg font-bold text-xs">{n}</span>
              <h3 className="mt-3 text-base font-semibold text-fg">{title}</h3>
              <p className="mt-1 text-xs text-fg-muted leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Four kinds of collab" title="Pick the one that fits the relationship." />
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {(['shoutout', 'joint_video', 'live_stream', 'channel_feature'] as const).map((k) => (
            <Card key={k} padding="lg">
              <h3 className="text-xl font-semibold text-fg">{COLLAB_KIND_LABEL[k]}</h3>
              <p className="mt-2 text-base text-fg-muted leading-relaxed">{COLLAB_KIND_DESCRIPTION[k]}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="What you get" title="Built for real partnerships." />
        <FeatureGrid items={FEATURES} />
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="Pricing" title="Pick an escrow level you\'re comfortable with." description="Both creators put up the same amount. Platform fee is 15% per side." />
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1100px] mx-auto">
          {ESCROW_PRESETS.map((p) => (
            <Card key={p.id} padding="md" className={p.highlight ? 'ring-2 ring-brand' : ''}>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{p.label}</p>
              <p className="mt-2 font-mono tabular text-4xl font-extrabold text-fg">${p.amountUsd}</p>
              <p className="mt-1 text-xs text-fg-muted">per side</p>
              {p.highlight && (
                <p className="mt-2 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-tint text-brand">
                  {p.highlight}
                </p>
              )}
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-fg-muted">
          Custom amounts from $5 to $5,000 per side. Set whatever feels fair to both creators.
        </p>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="FAQ" title="Common questions" />
        <div className="mt-12 max-w-[760px] mx-auto"><FaqBlock items={FAQS} /></div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
            Stop reaching out<br /><span className="text-brand">to ghosts.</span>
          </h2>
          <div className="mt-8">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Browse the creator directory
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
