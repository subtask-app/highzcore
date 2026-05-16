import Link from 'next/link';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal } from '@/components/marketing/sections';
import { Card } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Contact Highzcore',
  description: 'Reach the Highzcore team via Telegram, email, or in-app support.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Contact', url: `${SITE_URL}/contact` },
      ])} />

      <Hero
        scene="calm"
        eyebrow="Contact"
        title={<>Get in touch.</>}
        description="The fastest path is Telegram — a human usually replies within an hour during the day. Email works too if you prefer."
      />

      <Reveal>
        <div className="grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          <Card padding="lg" className="text-center">
            <Send className="h-7 w-7 text-brand mx-auto" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-fg">Telegram (fastest)</h2>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              DM our bot. Forwards straight to the team.
            </p>
            <Link
              href="https://t.me/HighzcoreOfficial_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              @HighzcoreOfficial_bot
            </Link>
          </Card>
          <Card padding="lg" className="text-center">
            <Mail className="h-7 w-7 text-brand mx-auto" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-fg">Email</h2>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              For longer-form requests, partnerships, press.
            </p>
            <a
              href="mailto:hello@highzcore.tech"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              hello@highzcore.tech
            </a>
          </Card>
          <Card padding="lg" className="text-center">
            <MessageSquare className="h-7 w-7 text-brand mx-auto" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-fg">In-app support</h2>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Logged in? Use the support tab in your dashboard.
            </p>
            <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Log in
            </Link>
          </Card>
        </div>
      </Reveal>

      <Reveal>
        <div className="max-w-[800px] mx-auto">
          <p className="text-sm text-fg-muted leading-relaxed">
            <strong className="text-fg">For abuse / security reports</strong>, email{' '}
            <a href="mailto:security@highzcore.tech" className="text-brand font-semibold">security@highzcore.tech</a>.
            We respond within 24 hours and take vulnerability disclosure seriously.
          </p>
          <p className="mt-4 text-sm text-fg-muted leading-relaxed">
            <strong className="text-fg">For press inquiries</strong>, email{' '}
            <a href="mailto:press@highzcore.tech" className="text-brand font-semibold">press@highzcore.tech</a>.
          </p>
          <p className="mt-4 text-sm text-fg-muted leading-relaxed">
            <strong className="text-fg">For legal</strong> — including takedown, DMCA, GDPR requests — email{' '}
            <a href="mailto:legal@highzcore.tech" className="text-brand font-semibold">legal@highzcore.tech</a>.
          </p>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
