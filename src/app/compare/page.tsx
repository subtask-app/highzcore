import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal } from '@/components/marketing/sections';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Compare — Highzcore vs sub services / TubeBuddy / VidIQ',
  description: 'How Highzcore stacks up against the alternatives — sub services, TubeBuddy, VidIQ, manual surveys.',
  alternates: { canonical: '/compare' },
};

interface CompareRow {
  feature: string;
  hzc: boolean | string;
  alt: boolean | string;
}

function Cell({ v }: { v: boolean | string }) {
  if (typeof v === 'boolean') {
    return v
      ? <Check className="h-5 w-5 text-success" />
      : <X className="h-5 w-5 text-danger" />;
  }
  return <span className="text-sm text-fg">{v}</span>;
}

const TABLES: { title: string; subtitle: string; href: string; rows: CompareRow[] }[] = [
  {
    title: 'Highzcore vs sub services',
    subtitle: 'You\'re tempted to buy subscribers because growth is slow. Here\'s the trade.',
    href: '/compare/sub-services',
    rows: [
      { feature: 'Increases watch time + retention', hzc: 'Yes (real watching)', alt: false },
      { feature: 'Safe for monetization',            hzc: true,  alt: 'Risk of channel termination' },
      { feature: 'Real human feedback',              hzc: true,  alt: false },
      { feature: 'YouTube TOS compliant',            hzc: true,  alt: false },
      { feature: 'Price per outcome',                hzc: 'From $50',  alt: 'From $5 (dangerous)' },
      { feature: 'Detection by YouTube ML',          hzc: 'Not possible — no engagement faking', alt: 'Likely, eventually' },
    ],
  },
  {
    title: 'Highzcore vs TubeBuddy / VidIQ',
    subtitle: 'They tell you what happened. We tell you why.',
    href: '#',
    rows: [
      { feature: 'Tells you what to fix',            hzc: 'Yes — real audience says so',     alt: 'Best guess from your past data' },
      { feature: 'Works on a video you haven\'t published yet', hzc: true,  alt: false },
      { feature: 'Verbatim audience quotes',         hzc: true,  alt: false },
      { feature: 'Audience demographic matching',    hzc: true,  alt: 'Partial' },
      { feature: 'Thumbnail A/B testing',            hzc: 'Pre-publish, with real CTR',      alt: 'Post-publish, uses real impressions' },
      { feature: 'Channel auto-optimisation suggestions', hzc: false, alt: true },
      { feature: 'Subscription required',            hzc: 'No (pay per project)',             alt: 'Yes' },
    ],
  },
  {
    title: 'Highzcore vs DIY surveys',
    subtitle: 'You could just post a poll in Discord. Here\'s when that breaks.',
    href: '#',
    rows: [
      { feature: 'Reaches non-existing audience',    hzc: true,  alt: false },
      { feature: 'Demographic targeting',            hzc: true,  alt: false },
      { feature: 'Statistical analysis',             hzc: true,  alt: 'You do it yourself' },
      { feature: 'Anti-bias randomisation',          hzc: true,  alt: false },
      { feature: 'Anti-rush watch gate',             hzc: true,  alt: false },
      { feature: 'Cost per response',                hzc: '$0.20–1', alt: 'Free, but biased' },
    ],
  },
];

export default function ComparePage() {
  return (
    <MarketingLayout>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Compare', url: `${SITE_URL}/compare` },
      ])} />

      <Hero
        eyebrow="Compare"
        title={<>How Highzcore stacks up.<br /><span className="text-fg-muted">Honest tables.</span></>}
        description="No spin. Here's what we do well + what we don't do at all."
      />

      <Reveal>
        <div className="space-y-12">
          {TABLES.map((t) => (
            <Card key={t.title} padding="lg">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">{t.title}</h2>
                  <p className="mt-2 text-base text-fg-muted">{t.subtitle}</p>
                </div>
                {t.href !== '#' && (
                  <Link href={t.href} className="text-sm font-semibold text-brand inline-flex items-center gap-1">
                    Deep dive <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle border-b border-border">
                      <th className="py-3 pr-6">Feature</th>
                      <th className="py-3 pr-6 text-center">Highzcore</th>
                      <th className="py-3 pr-6 text-center">Alternative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r) => (
                      <tr key={r.feature} className="border-b border-border last:border-b-0">
                        <td className="py-3 pr-6 text-fg">{r.feature}</td>
                        <td className="py-3 pr-6 text-center"><Cell v={r.hzc} /></td>
                        <td className="py-3 pr-6 text-center"><Cell v={r.alt} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Convinced?<br /><span className="text-brand">Run a $10 test.</span>
          </h2>
          <div className="mt-8">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up — free
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
