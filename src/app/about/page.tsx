import Link from 'next/link';
import { ArrowRight, Globe2, Handshake, ShieldCheck } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'About Highzcore',
  description: 'Highzcore is a creator growth platform built for YouTube creators in emerging markets. Real audiences, honest data, real growth.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <MarketingLayout>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'About', url: `${SITE_URL}/about` },
      ])} />

      <Hero
        eyebrow="About"
        title={<>Built for creators<br /><span className="text-fg-muted">who hate guessing.</span></>}
        description={
          <>
            We started Highzcore because every creator we knew was shipping videos blind and
            stalling out somewhere around the 1k–10k subscriber mark. The advice they were getting
            was generic. The tools they had analyzed history, not options. We built the missing
            piece: pre-publication feedback from real audiences, plus the rest of the creator
            growth stack on the same platform.
          </>
        }
      />

      <Reveal>
        <SectionHeading
          eyebrow="What we believe"
          title="Real audiences. Honest data. Real growth."
        />
        <FeatureGrid items={[
          { icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />, title: 'Compliance is a feature',  description: "We don't sell engagement. We don't touch YouTube accounts. Every product we ship works because YouTube would approve, not because they wouldn't notice." },
          { icon: <Globe2 className="h-6 w-6" strokeWidth={1.5} />,      title: 'Built for emerging markets', description: "We're headquartered in Nigeria and prioritise the regions our workers and creators live in — Africa, South Asia, Southeast Asia." },
          { icon: <Handshake className="h-6 w-6" strokeWidth={1.5} />,   title: 'Workers are workers',       description: 'Every worker on Highzcore is doing skilled, paid work. They get respect, fair pay, clear payment terms, and a tier system that rewards consistency.' },
        ]} />
      </Reveal>

      <Reveal>
        <SectionHeading
          eyebrow="How we make money"
          title="30% on tasks. 15% per side on collabs."
          description="Transparent. No hidden fees. The 70% / 85% rest goes to workers (or back to creators on completed collabs)."
        />
        <Card padding="lg" className="mt-8 max-w-[800px]">
          <p className="text-base text-fg leading-relaxed">
            We charge a platform fee per project. On Insights, ABTest, and Promote, that fee is
            30% of the project total — the rest funds the worker pool. On Collab, both creators
            pay 15% to us when the collab completes; the remaining 85% per side is returned to them.
          </p>
          <p className="mt-4 text-base text-fg-muted leading-relaxed">
            That fee covers: building and maintaining the platform, customer support, fraud
            prevention, payment processing, dispute resolution, and the team behind it.
          </p>
        </Card>
      </Reveal>

      <Reveal>
        <SectionHeading
          eyebrow="What we don't do"
          title="The bright lines."
        />
        <Card padding="lg" className="mt-8 max-w-[800px]">
          <ul className="space-y-3">
            <li className="text-base text-fg-muted leading-relaxed">
              <strong className="text-fg">We don't sell subscribers, views, likes, or comments.</strong>{' '}
              That whole category gets channels banned. We're the alternative — diagnostic feedback
              that actually grows you.
            </li>
            <li className="text-base text-fg-muted leading-relaxed">
              <strong className="text-fg">We don't touch your YouTube account.</strong>{' '}
              Highzcore never logs into your channel, never reads your private data, never posts
              anything on your behalf.
            </li>
            <li className="text-base text-fg-muted leading-relaxed">
              <strong className="text-fg">We don't promise virality.</strong>{' '}
              We help you make better content. The viral moment is yours to earn.
            </li>
            <li className="text-base text-fg-muted leading-relaxed">
              <strong className="text-fg">We don't run hype campaigns.</strong>{' '}
              You won't see urgency manipulation, FOMO timers, or "only 3 spots left" garbage.
              It's not who we are.
            </li>
          </ul>
        </Card>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Want to know more?
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/contact" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Contact us
            </LinkButton>
            <Link href="/blog" className="text-sm font-semibold text-fg-muted hover:text-fg">
              Read the blog →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
