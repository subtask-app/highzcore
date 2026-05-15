import { ArrowRight, BarChart3, Clock, MessageSquareHeart, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero, Reveal, SectionHeading, FeatureGrid } from '@/components/marketing/sections';
import { FaqBlock } from '@/components/marketing/FaqBlock';
import { Card, LinkButton } from '@/components/ui';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '@/components/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';

export const metadata = {
  title: 'For creators — grow your YouTube channel with real data',
  description:
    'Highzcore is built for YouTube creators with 0–100k subscribers who are stuck. Real audience feedback, thumbnail testing, real promotion, real collabs — from $10.',
  alternates: { canonical: '/for-creators' },
};

const FAQS = [
  {
    q: 'Who is Highzcore for?',
    a: "YouTube creators with 0–100,000 subscribers who upload regularly but aren't growing as fast as they'd like, and want to know why. You can have a great hook and bad packaging; great packaging and a slow hook; or just be aiming at the wrong audience. We help you figure out which.",
  },
  {
    q: 'How much does it cost?',
    a: 'From $10 for a thumbnail test, $50 for a 50-response Insights study, $35 for a 10-share Promote campaign. No subscription — pay per project.',
  },
  {
    q: "What if I'm in a tiny niche?",
    a: "Targeting filters by niche tag (we have 30+) plus country, language, gender, and age. For very niche channels (anime VA reactions, vintage tractor repair, etc.) start with a broader niche tag and we'll filter on language + country — most niches still have viable panels in the worker pool.",
  },
  {
    q: "Will my videos suddenly go viral?",
    a: "No, and anyone who tells you that is lying. We help you ship better videos so your audience grows on its merit. There's no algorithm hack — there's just \"is the video actually good?\". We help you answer that question before publishing.",
  },
  {
    q: "Can I use this if my channel isn't monetized yet?",
    a: 'Yes — most of our smaller creators are pre-monetization. Insights is cheap enough ($50 for 50 responses) that you can test 2–3 videos per month on a tiny budget and learn faster than you would publishing blindly.',
  },
];

export default function ForCreatorsPage() {
  return (
    <MarketingLayout>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'For creators', url: `${SITE_URL}/for-creators` },
      ])} />

      <Hero
        eyebrow="For creators"
        title={<>Stop guessing.<br /><span className="text-fg-muted">Start shipping with data.</span></>}
        description={
          <>
            Highzcore is built for YouTube creators stuck in the 0–100k zone — uploading regularly,
            not growing, and tired of generic advice. We help you find out{' '}
            <span className="font-semibold text-fg">why</span>.
          </>
        }
        actions={
          <>
            <LinkButton href="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign up — free
            </LinkButton>
            <LinkButton href="/pricing" size="lg" variant="secondary">
              See pricing
            </LinkButton>
          </>
        }
      />

      <Reveal>
        <SectionHeading
          eyebrow="The problem"
          title="Generic advice ≠ honest data."
          description="You've heard all the YouTube growth advice. Improve your hook. Test thumbnails. Engage in the first 30 seconds. None of that tells you what's broken in your specific video."
        />
        <FeatureGrid items={[
          { icon: <MessageSquareHeart className="h-6 w-6" strokeWidth={1.5} />, title: 'You ship blind',                  description: "Without pre-publication feedback, every upload is a roll of the dice. Bad title? Bad thumbnail? Wrong audience? You find out 24–48 hours too late." },
          { icon: <TrendingUp className="h-6 w-6" strokeWidth={1.5} />,         title: 'Your CTR is flatlined',           description: 'You\'ve A/B tested 6 thumbnails with YouTube\'s native tool. Each test cost you views. You still don\'t know what works.' },
          { icon: <Users className="h-6 w-6" strokeWidth={1.5} />,              title: "Your audience size limits your testing", description: "If you have 500 subs, you can't poll them — they're not engaged enough to vote. You need an outside panel." },
        ]} />
      </Reveal>

      <Reveal>
        <SectionHeading
          eyebrow="The fix"
          title="Real audiences. Honest data. Real growth."
        />
        <FeatureGrid items={[
          { icon: <Target className="h-6 w-6" strokeWidth={1.5} />,             title: 'Match your real audience',        description: "Country, language, niche, age, gender — the panel you pick mirrors your actual viewers, not random clickers." },
          { icon: <Clock className="h-6 w-6" strokeWidth={1.5} />,              title: 'Get feedback before you publish', description: 'Studies start in minutes. Most fill within 24 hours. Pivot the video — or the channel — before it ships.' },
          { icon: <BarChart3 className="h-6 w-6" strokeWidth={1.5} />,          title: "See the why, not just the what",  description: "YouTube Studio shows you what happened. Highzcore shows you why people did or didn\'t click, watch, subscribe." },
          { icon: <Sparkles className="h-6 w-6" strokeWidth={1.5} />,           title: '4 products, one platform',        description: 'Insights, AB testing, Promote, Collab. Switch between products from the same dashboard, same money, same worker pool.' },
        ]} />
      </Reveal>

      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Use cases by stage"
          title="Built for every growth stage."
        />
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">0 – 1,000 subscribers</p>
            <h3 className="mt-2 text-xl font-semibold text-fg">Find your hook</h3>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Run an Insights study on your last 3 videos. Find the patterns in what works vs. what doesn\'t.
              Apply to the next upload. Skip the "post 100 videos and pray" advice.
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">1k – 10k subscribers</p>
            <h3 className="mt-2 text-xl font-semibold text-fg">Optimize the packaging</h3>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Test thumbnails before publishing. Promote 1–2 videos a month to real audiences on
              your target platforms. Start collabing with creators your size.
            </p>
          </Card>
          <Card padding="lg">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">10k+ subscribers</p>
            <h3 className="mt-2 text-xl font-semibold text-fg">Scale + collab</h3>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Deep Insights studies on bigger videos. Promote campaigns on multiple platforms.
              Collab with bigger creators using two-sided escrow so neither side ghosts.
            </p>
          </Card>
        </div>
      </Reveal>

      <Reveal>
        <SectionHeading align="center" eyebrow="FAQ" title="Common questions" />
        <div className="mt-12 max-w-[760px] mx-auto">
          <FaqBlock items={FAQS} />
        </div>
      </Reveal>

      <Reveal className="!py-24">
        <div className="text-center max-w-[800px] mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-fg leading-[1.05]">
            Your next video<br /><span className="text-brand">doesn\'t need to be a guess.</span>
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
