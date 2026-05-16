import { ArrowRight, Briefcase, Clock, DollarSign, Globe2, ShieldCheck, Trophy } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'Earn for your opinions — Highzcore for workers',
  description:
    "Watch YouTube videos in niches you like, answer honest questions, get paid in USDT (TRC20). Withdraw from $10. No selling, no spam, no shady stuff.",
  alternates: { canonical: '/for-workers' },
};

const FAQS = [
  { q: 'How do I get paid?', a: 'USDT on the TRON network (TRC20). Withdraw anytime your available balance crosses $10. Flat $1 fee per withdrawal. Tx hash visible on Tronscan.' },
  { q: 'How much can I realistically earn?', a: 'Depends on volume + tier. Insights pays $0.20–$1 per response (5–10 min each). AB tests $0.25–$0.35 per vote (30 seconds each). Promote pays $2–$3 per share. Consistent workers doing 1–2 hours a day realistically earn $30–$120/month.' },
  { q: 'Do I need a YouTube account?', a: "No — Insights and AB Tests just need a Telegram account and an opinion. Promote needs you to have a real audience on a social platform (verified by us)." },
  { q: 'Will I lose money if my work is rejected?', a: "No — you don't pay anything upfront. If a submission is rejected, the pending payout returns to the pool. Repeated low-quality work moves you to a lower tier." },
  { q: 'Can I do this from my phone?', a: 'Yes. The whole platform runs as a Telegram mini-app on your phone, plus a regular website for the same account.' },
  { q: 'Is this safe / real?', a: "Yes — real platform with real payouts (see tx hashes on Tronscan). We never charge to join, never ask for crypto deposits, never sell your data. Anyone asking you for money or your password is a scam — report it." },
  { q: 'What countries are supported?', a: 'Anyone can sign up; payouts work globally via USDT. Most tasks target Nigeria, Ghana, India, Indonesia, Malaysia, Singapore, the Philippines, Kenya.' },
];

export default function ForWorkersPage() {
  return (
    <MarketingLayout>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'For workers', url: `${SITE_URL}/for-workers` },
      ])} />

      <Hero
        eyebrow="For workers"
        title={<>Earn for your opinions.<br /><span className="text-fg-muted">Get paid in USDT.</span></>}
        description={<>Watch videos in niches you like. Answer thoughtful questions. Get paid in USDT (TRC20). Withdraw anytime your balance crosses $10.</>}
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up as a worker
            </LinkButton>
            <LinkButton href="#how" size="lg" variant="secondary">How it works</LinkButton>
          </>
        }
      />

      <Reveal id="how">
        <SectionHeading align="center" eyebrow="How it works" title="Four steps." />
        <div className="mt-12 grid md:grid-cols-4 gap-4 max-w-[1100px] mx-auto">
          {[
            { n: '1', title: 'Sign up free',          desc: 'No deposits, no fees. Telegram or email.' },
            { n: '2', title: 'Pick tasks you like',   desc: 'Filter by niche + language. Claim only what fits.' },
            { n: '3', title: 'Submit honest work',    desc: 'Watch. Answer or vote. Submit.' },
            { n: '4', title: 'Withdraw USDT',         desc: 'From $10. Tx hash on Tronscan.' },
          ].map(({ n, title, desc }) => (
            <Card key={n} padding="md" className="relative">
              <span className="absolute -top-3 left-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-fg font-bold text-xs">{n}</span>
              <h3 className="mt-3 text-base font-semibold text-fg">{title}</h3>
              <p className="mt-1 text-sm text-fg-muted leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading eyebrow="What you get" title="Real work. Real payouts." />
        <FeatureGrid items={[
          { icon: <Briefcase className="h-6 w-6" strokeWidth={1.5} />,   title: '4 task types',                description: 'Insights, AB tests, Promote, more coming.' },
          { icon: <Clock className="h-6 w-6" strokeWidth={1.5} />,       title: 'Work on your schedule',        description: "No shifts. Pick up tasks when you have 5 minutes; ignore them when you don't." },
          { icon: <DollarSign className="h-6 w-6" strokeWidth={1.5} />,  title: 'USDT TRC20 payouts',          description: 'Withdraw from $10. Flat $1 fee. On-chain tx hash visible.' },
          { icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />, title: 'Admin-reviewed quality',       description: 'Every submission reviewed. Honest, thoughtful work gets approved fast and moves you up tiers.' },
          { icon: <Trophy className="h-6 w-6" strokeWidth={1.5} />,      title: 'Tier system with real perks',  description: "Reach Tier A: first dibs on premium tasks, lower withdrawal fees, direct admin channel." },
          { icon: <Globe2 className="h-6 w-6" strokeWidth={1.5} />,      title: 'Global worker pool',           description: 'Workers spread across 10+ countries. Telegram-native.' },
        ]} />
      </Reveal>

      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Realistic earnings"
          title="What workers actually make."
          description="No hype. Your effort + tier + how many tasks you claim determine your monthly take."
        />
        <div className="mt-12 grid md:grid-cols-3 gap-4 max-w-[1100px] mx-auto">
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Casual</p>
            <p className="mt-2 font-mono tabular text-4xl font-extrabold text-fg">$15–40</p>
            <p className="mt-1 text-xs text-fg-muted">per month</p>
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">~3–5 tasks per day, weekends only.</p>
          </Card>
          <Card padding="lg" className="ring-2 ring-brand">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Daily</p>
            <p className="mt-2 font-mono tabular text-4xl font-extrabold text-fg">$50–120</p>
            <p className="mt-1 text-xs text-fg-muted">per month</p>
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">1 hour a day, every day. Tier B+ within 30 days.</p>
          </Card>
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Power user</p>
            <p className="mt-2 font-mono tabular text-4xl font-extrabold text-fg">$120–300</p>
            <p className="mt-1 text-xs text-fg-muted">per month</p>
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">2–3 hours a day, Tier A, regular Promote claims.</p>
          </Card>
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="FAQ" title="Common questions" />
        <div className="mt-12 max-w-[760px] mx-auto"><FaqBlock items={FAQS} /></div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
            Your opinions<br /><span className="text-brand">are worth real money.</span>
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
