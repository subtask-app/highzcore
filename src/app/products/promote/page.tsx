import Link from 'next/link';
import { ArrowRight, BarChart3, Globe2, LinkIcon, Megaphone, ShieldCheck, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { PriceCard } from '@/components/marketing/PriceCard';
import { Card, LinkButton, ProductBadge } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema, promoteServiceSchema } from '@/components/seo/structured-data';
import { PROMOTE_TIERS, feeBreakdown } from '@/lib/promote/pricing';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Promote — share your YouTube video to real verified audiences',
  description:
    "Workers with verified follower counts share your video to their real audiences on X, Instagram, TikTok, Telegram, WhatsApp, Facebook, and YouTube. UTM-tracked in your YouTube Studio.",
  alternates: { canonical: '/products/promote' },
};

const FAQS = [
  {
    q: 'Is this the same as buying views or shares?',
    a: "No. Promote sends your video to real people with real audiences. The share goes to actual followers — kids, gamers, finance nerds, whoever — not bots, not coordinated farms. UTMs let your YouTube Studio attribute legitimate organic traffic to highzcore.",
  },
  {
    q: 'How do you verify worker follower counts?',
    a: 'Workers upload a screenshot and link their account; an admin manually verifies. For X and IG-graph-API-friendly platforms we may add automated checks later. Either way, the count you see in your campaign is real.',
  },
  {
    q: 'Can I set a minimum audience size?',
    a: 'Yes. You set a minimum follower count per share when launching the campaign. Only workers above that threshold can claim a share.',
  },
  {
    q: 'How do I know if the share actually happened?',
    a: 'Each worker submits the post URL + an optional screenshot. We spot-check; admins approve or reject. Approved shares show up in your campaign report with the post URL and platform.',
  },
  {
    q: 'How are clicks tracked?',
    a: "Every share URL gets a unique UTM (utm_source=highzcore + utm_campaign=hzc_xxx + utm_medium=<platform>). Open YouTube Studio → Reach → External traffic to see clicks attributed to us.",
  },
  {
    q: "Is this allowed by YouTube?",
    a: "Yes — driving external traffic to your videos is something YouTube actively encourages. We're not buying views inside YouTube; we're paying real people on other platforms to share your link with their audiences.",
  },
];

const FEATURES = [
  { icon: <Users className="h-6 w-6" strokeWidth={1.5} />,       title: 'Verified follower counts',         description: 'Every worker is verified by an admin. You see real audience sizes, not self-reported numbers.' },
  { icon: <Globe2 className="h-6 w-6" strokeWidth={1.5} />,      title: 'Seven platforms supported',        description: 'X / Twitter, Instagram, TikTok, Telegram, WhatsApp groups, Facebook, YouTube.' },
  { icon: <LinkIcon className="h-6 w-6" strokeWidth={1.5} />,    title: 'UTM-tagged share URLs',             description: 'Auto-generated UTM campaign id appended to your video link so YouTube Studio attributes clicks correctly.' },
  { icon: <Megaphone className="h-6 w-6" strokeWidth={1.5} />,   title: 'Custom share message',             description: 'Write a script workers can paste verbatim, or let them paraphrase in their own voice.' },
  { icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />, title: 'Admin-reviewed shares',            description: 'Each submission is reviewed before payout. Spammy or low-effort posts get rejected — workers lose the payout.' },
  { icon: <BarChart3 className="h-6 w-6" strokeWidth={1.5} />,   title: 'Real-time campaign report',        description: 'Watch shares arrive live with status badges, platform, and post URLs.' },
];

export default function PromoteProductPage() {
  return (
    <MarketingLayout>
      <JsonLd data={promoteServiceSchema(SITE_URL)} />
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Promote', url: `${SITE_URL}/products/promote` },
      ])} />

      <Hero
        scene="promote"
        eyebrow="Promote"
        title={<>Reach real audiences.<br /><span className="text-fg-muted">Not bots.</span></>}
        description={<>Workers with verified follower counts share your video to their actual audiences on 7 platforms. UTM-tracked in your YouTube Studio.</>}
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Launch a campaign — $35
            </LinkButton>
            <LinkButton href="#how" size="lg" variant="secondary">How it works</LinkButton>
          </>
        }
      />

      <div className="mx-auto mb-16 max-w-[1100px] px-4 md:px-8">
        <Card padding="lg" className="text-center">
          <ProductBadge product="promote" size="xl" className="mx-auto" />
          <p className="mt-4 text-base md:text-lg text-fg-muted max-w-[700px] mx-auto leading-relaxed">
            Real shares to real audiences. UTM-tracked. Admin-reviewed. Pay per delivered share, not per view.
          </p>
        </Card>
      </div>

      <Reveal id="how">
        <SectionHeading align="center" eyebrow="How it works" title="Three steps." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {[
            { n: '1', title: 'Pick platforms + min audience', desc: 'Choose the platforms you want reach on and the minimum follower count workers must have.' },
            { n: '2', title: 'Workers claim share slots',     desc: 'Eligible workers see your campaign in their task feed and post your video to their audience with UTMs attached.' },
            { n: '3', title: 'Approve + see attribution',     desc: 'Admin reviews each share; approved ones count. Check YouTube Studio External traffic for the UTM campaign id.' },
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
        <SectionHeading eyebrow="What's in every campaign" title="Built for real traffic." />
        <FeatureGrid items={FEATURES} />
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="Pricing" title="Pay per delivered share." />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {PROMOTE_TIERS.map((t) => {
            const bd = feeBreakdown(t.totalUsd, t.shareCount);
            return (
              <PriceCard
                key={t.id}
                label={t.label}
                priceUsd={t.totalUsd}
                perUnit={`${t.shareCount} shares`}
                features={[
                  `Worker payout: $${bd.perTask.toFixed(2)} per share`,
                  'Verified audience match',
                  'Auto-UTM in YouTube Studio',
                  'Admin-reviewed submissions',
                ]}
                ctaHref="/signup"
                ctaLabel="Launch campaign"
                highlight={t.highlight}
              />
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="FAQ" title="Common questions" />
        <div className="mt-12 max-w-[760px] mx-auto"><FaqBlock items={FAQS} /></div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
            Get your video<br /><span className="text-brand">in front of real people.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Launch a campaign
            </LinkButton>
            <Link href="/compare/sub-services" className="text-sm font-semibold text-fg-muted hover:text-fg">
              Why this beats sub services →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
