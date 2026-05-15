import Link from 'next/link';
import { ArrowRight, AlertTriangle, Check, Shield, X } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading } from '@/components/marketing/sections';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Why we\'re not a sub service — Highzcore vs buying subscribers',
  description: 'Buying YouTube subscribers tanks your channel. Here\'s exactly how — and what to do instead.',
  alternates: { canonical: '/compare/sub-services' },
};

export default function SubServicesPage() {
  return (
    <MarketingLayout>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Compare', url: `${SITE_URL}/compare` },
        { name: 'vs sub services', url: `${SITE_URL}/compare/sub-services` },
      ])} />

      <Hero
        eyebrow="Compare → Sub services"
        title={<>Why we\'re not<br /><span className="text-fg-muted">a sub service.</span></>}
        description="Buying subscribers feels fast. It also gets channels banned, kills monetization, and trashes the algorithm signal that helps real growth. Here\'s exactly how — and what to do instead."
      />

      <Reveal>
        <SectionHeading
          eyebrow="Why people consider sub services"
          title="It\'s tempting. Especially at 200 subs."
        />
        <Card padding="lg" className="mt-8 max-w-[760px]">
          <p className="text-base text-fg leading-relaxed">
            You\'ve been uploading for 8 months. You have 247 subscribers. Watch time is anemic.
            Then someone advertises &quot;1,000 real-looking subscribers for $40&quot; and you think:
            <em>well, if it\'s real-looking, what\'s the harm?</em>
          </p>
          <p className="mt-4 text-base text-fg-muted leading-relaxed">
            We get it. We almost shipped one of these in 2026. We didn\'t — because what
            happens next is almost always bad for the creator.
          </p>
        </Card>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="The trap" title="Five things that go wrong." />
        <div className="mt-8 space-y-4 max-w-[760px]">
          {[
            {
              title: "Engagement collapses.",
              body: 'You go from 247 subs to 1,247 subs overnight. The next video gets the same 50 views you used to get. YouTube\'s algorithm sees subscribers who don\'t watch your content, infers your channel is low-quality, demotes you. Subs counter went up; reach went down.',
            },
            {
              title: 'Detection improves over time.',
              body: 'YouTube\'s ML for engagement fraud gets sharper every quarter. Patterns that worked in 2022 are obvious now: bursty subscriber spikes, accounts subscribing to wildly unrelated channels, no comments or watch history from the new subs. You\'re on borrowed time.',
            },
            {
              title: 'Punishment is rough.',
              body: 'Worst case: channel terminated. Mid case: monetization revoked + subscriber wipe. Best case: shadow-throttling that\'s impossible to recover from. The channel you spent 8 months on becomes uninvestible.',
            },
            {
              title: 'Your real audience notices.',
              body: '100 subs with regular engagement is more impressive to a sponsor than 10,000 subs with 1% engagement. Brands check engagement rates. Inflated channels stick out.',
            },
            {
              title: 'It costs more in the long run.',
              body: 'When the algorithm penalises you, you have to spend MORE to break out. Some creators end up spending thousands chasing the boost. The original $40 was the start of a money pit.',
            },
          ].map(({ title, body }) => (
            <Card key={title} padding="lg" className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-fg">{title}</h3>
                <p className="mt-2 text-base text-fg-muted leading-relaxed">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Why we\'re different" title="What Highzcore does instead." />
        <Card padding="lg" className="mt-8 bg-gradient-to-br from-brand-tint to-transparent border-brand/30">
          <Shield className="h-8 w-8 text-brand" />
          <p className="mt-4 text-base text-fg leading-relaxed">
            We never touch your YouTube account. We never put a single fake subscriber on your channel. We don\'t artificially inflate any engagement metric. We sell <strong>diagnostic feedback</strong> — real people watching your video and telling you why it\'s not landing — so you can ship videos that grow your channel <em>organically</em>.
          </p>
          <p className="mt-4 text-base text-fg-muted leading-relaxed">
            The 10× difference isn\'t magic. It\'s knowing what to fix in your titles, thumbnails, hooks, and pacing before you publish. That\'s what every viral creator iterates on. We\'re the missing tool.
          </p>
        </Card>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Head-to-head" title="The actual table." />
        <Card padding="lg" className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle border-b border-border">
                <th className="py-3 pr-6"></th>
                <th className="py-3 px-4 text-center">Highzcore</th>
                <th className="py-3 px-4 text-center">Sub service</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Increases subscriber count', false, true],
                ['Increases meaningful audience',                true, false],
                ['Algorithm penalty risk',                       'None', 'High'],
                ['Channel termination risk',                     'None', 'Real, eventual'],
                ['Improves your future videos',                  true, false],
                ['Compliant with YouTube TOS',                   true, false],
                ['Cost',                                         'From $50', '$5–$40 / 1,000 subs'],
                ['Outcome 12 months later',                      'Better videos, organic growth', 'Penalised or banned'],
              ].map(([f, hzc, alt], i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="py-3 pr-6 text-fg">{f as string}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof hzc === 'boolean'
                      ? (hzc ? <Check className="h-5 w-5 text-success mx-auto" /> : <X className="h-5 w-5 text-fg-subtle mx-auto" />)
                      : <span className="text-sm text-fg">{hzc as string}</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof alt === 'boolean'
                      ? (alt ? <Check className="h-5 w-5 text-fg-subtle mx-auto" /> : <X className="h-5 w-5 text-danger mx-auto" />)
                      : <span className="text-sm text-fg-muted">{alt as string}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Build a channel that<br /><span className="text-brand">can\'t be taken from you.</span>
          </h2>
          <p className="mt-4 text-base text-fg-muted">
            Run one Insights study on your worst-performing video. See what the audience says.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start a study — $50
            </LinkButton>
            <Link href="/products/insights" className="text-sm font-semibold text-fg-muted hover:text-fg">
              How Insights works →
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
