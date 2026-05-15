import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Help center — Highzcore',
  description: 'Frequently asked questions about Highzcore — creator side, worker side, pricing, payments, security.',
  alternates: { canonical: '/help' },
};

const CREATOR_FAQS = [
  { q: 'How do I get started as a creator?', a: 'Sign up, pick "I\'m a creator" during onboarding, verify your YouTube channel by pasting the URL, then choose one of the four products and launch a project.' },
  { q: 'How long until I see results?', a: 'First responses on an Insights study typically arrive within 30 minutes. Smaller studies fill in 6–12 hours; bigger ones in 24–72 hours. AB tests finish even faster.' },
  { q: 'Can I cancel a project?', a: "Yes — as long as no tasks have been approved yet. Go to the project detail page and click Cancel. Unspent worker pool is refunded." },
  { q: 'How do I read my Insights report?', a: 'Open the project detail page and click "Open report". You\'ll see per-question aggregates (bar charts for multiple choice, histograms for ratings, drop-off heatmaps for timestamps) and the full text of every written answer.' },
  { q: 'Can I run more than one project at a time?', a: 'Yes — no limit. Each project is funded independently.' },
];

const WORKER_FAQS = [
  { q: 'How do I get started as a worker?', a: 'Sign up, pick "I\'m a worker" during onboarding, fill out your profile (country, languages, niches), and start claiming tasks from your dashboard.' },
  { q: 'How fast do I get paid?', a: "Submissions typically get reviewed within 24 hours. Once approved, the payout moves from Pending to Available in your wallet. Withdrawals process within 1 business day once you request them." },
  { q: 'What if a task is rejected?', a: "The pending payout returns to the pool. Repeated rejections lower your reliability + quality scores; you'll see this on /worker/tier. Honest, thoughtful work keeps you in good standing." },
  { q: 'Can I claim a task and not finish it?', a: 'Yes — but if you don\'t submit within 2 hours, the claim expires and the task returns to the pool. We track expired claims as a small reliability penalty.' },
  { q: 'How do I unlock higher tiers?', a: 'Tier C is the default. Reach Tier B with 20 approved tasks + 95% completion rate. Tier A needs 100 approved tasks + 98% completion rate + 30 days active.' },
];

const PAYMENTS_FAQS = [
  { q: 'What payment methods do you accept (creators)?', a: 'Card via Flutterwave (works for international Visa / Mastercard), USDT TRC20 via CCPayment, and direct bank transfer.' },
  { q: 'How do worker payouts work?', a: 'USDT on the TRON network (TRC20) via CCPayment. Workers add their TRC20 wallet address to their profile, withdraw from $10, and pay a flat $1 fee per withdrawal.' },
  { q: 'Why TRC20 specifically?', a: 'TRC20 has the lowest network fees of any USDT chain (under $1 per transaction) and the fastest confirmation time. Perfect for micro-payouts.' },
  { q: 'Do you charge fees on withdrawals?', a: 'Flat $1 per withdrawal — covers the network fee + provider fee. We don\'t take a percentage.' },
];

const SECURITY_FAQS = [
  { q: 'How is my data protected?', a: 'All data is stored in Supabase with Row-Level Security policies enforcing per-user access. We never share your data with creators (workers) or workers (creators) except within the scope of a specific project.' },
  { q: 'Will you ever sell my data?', a: 'No. Read our Privacy Policy for the full details, but the short version is: never.' },
  { q: 'What if I see something suspicious?', a: 'Report it. Email security@highzcore.tech or DM the bot. Fraud, phishing, attempts to take payment off-platform — we want to know about it.' },
];

const ALL_FAQS = [...CREATOR_FAQS, ...WORKER_FAQS, ...PAYMENTS_FAQS, ...SECURITY_FAQS];

export default function HelpPage() {
  return (
    <MarketingLayout>
      <JsonLd data={faqSchema(ALL_FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Help', url: `${SITE_URL}/help` },
      ])} />

      <Hero
        eyebrow="Help center"
        title={<>Got a question?<br /><span className="text-fg-muted">Browse the answers.</span></>}
        description={
          <>
            If you don\'t find what you need here,{' '}
            <Link href="/contact" className="text-brand font-semibold underline">contact us</Link> —
            we usually reply within an hour.
          </>
        }
      />

      <Reveal>
        <SectionHeading eyebrow="For creators" title="Creator FAQs" />
        <div className="mt-12 max-w-[760px]"><FaqBlock items={CREATOR_FAQS} /></div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="For workers" title="Worker FAQs" />
        <div className="mt-12 max-w-[760px]"><FaqBlock items={WORKER_FAQS} /></div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Payments" title="Pricing + payouts" />
        <div className="mt-12 max-w-[760px]"><FaqBlock items={PAYMENTS_FAQS} /></div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="Security" title="Privacy + security" />
        <div className="mt-12 max-w-[760px]"><FaqBlock items={SECURITY_FAQS} /></div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-[1.05]">
            Still need help?
          </h2>
          <p className="mt-4 text-base md:text-lg text-fg-muted">
            A human on the team usually replies within an hour during the day.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-brand text-brand-fg font-semibold"
            >
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </MarketingLayout>
  );
}
