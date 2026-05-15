import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading } from '@/components/marketing/sections';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Blog · Highzcore',
  description: 'Essays, deep dives, and how-tos for YouTube creators in emerging markets.',
  alternates: { canonical: '/blog' },
};

// Pre-launch placeholder articles — real posts get added post-launch.
const PLANNED = [
  { slug: 'why-your-channel-stalled-at-1000-subs',  title: 'Why your channel stalled at 1,000 subscribers (and what to do)' },
  { slug: 'thumbnail-vs-title-which-matters-more', title: 'Thumbnail vs title: which actually drives clicks?' },
  { slug: 'the-real-cost-of-buying-subscribers',   title: 'The real cost of buying subscribers (a Nigerian creator\'s story)' },
  { slug: 'how-to-write-a-youtube-hook',           title: 'How to write a YouTube hook that doesn\'t lose viewers in 8 seconds' },
  { slug: 'small-creator-collab-playbook',         title: 'The small-creator collab playbook: finding partners your size' },
];

export default function BlogIndex() {
  return (
    <MarketingLayout>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ])} />

      <Hero
        eyebrow="Blog"
        title={<>Essays + how-tos<br /><span className="text-fg-muted">for creators.</span></>}
        description="We're staging blog content for launch. The first 10 posts go up the week we open to the public. Subscribe via the bot to get them as they ship."
      />

      <Reveal>
        <SectionHeading eyebrow="Coming soon" title="Articles we're shipping." />
        <div className="mt-12 grid md:grid-cols-2 gap-4 max-w-[1100px]">
          {PLANNED.map((p) => (
            <Card key={p.slug} padding="lg" className="opacity-70">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Coming soon</p>
              <h2 className="mt-2 text-xl font-semibold text-fg tracking-tight">{p.title}</h2>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl font-bold tracking-tight text-fg leading-[1.05]">
            Want to be notified?
          </h2>
          <p className="mt-4 text-base text-fg-muted">
            New posts hit our Telegram channel first. Sign up to get them.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up — free
            </LinkButton>
            <Link href="https://t.me/HighzcoreChannel" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand">
              Follow on Telegram →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
