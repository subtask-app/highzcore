'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  PlayCircle,
  Shield,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/brand/Navbar';
import Logo from '@/components/brand/Logo';
import TelegramBack from '@/components/telegram/TelegramBack';
import { Card, Eyebrow, Highlight, Lead, Section, SectionHeading } from '@/components/brand/primitives';
import { PRICING_PACKAGES } from '@/lib/constants';
import { formatCurrency, formatNumber, calculateTotalPrice } from '@/lib/utils';
import { CREATOR_FAQS } from '@/lib/seo/faqs';

const STEPS = [
  { icon: Target,        title: 'Pick a target',         desc: 'Choose how many real subscribers you need — 100, 1,000, or anywhere in between.' },
  { icon: CreditCard,    title: 'Pay & confirm',         desc: 'Transfer to our account, share proof in the chat. We confirm within minutes.' },
  { icon: Eye,           title: 'Watch it climb',        desc: 'Live progress tracker. Every subscription is verified by the YouTube Data API in real time.' },
  { icon: CheckCircle2,  title: 'Hit monetization',      desc: 'Reach 1,000 and unlock the YouTube Partner Program. Done.' },
];

const FEATURES = [
  { icon: Shield,    title: 'Demonetization-safe',  desc: 'Real Google accounts subscribing through normal YouTube — not bots, not VPN farms.' },
  { icon: Zap,       title: 'Fast delivery',        desc: 'Most campaigns deliver in 7–14 days, depending on the target.' },
  { icon: PlayCircle,title: 'Verified in-flight',   desc: 'We call the YouTube API after every claim. If a sub doesn\'t hold, the worker isn\'t paid.' },
  { icon: Sparkles,  title: 'Human support',        desc: 'Direct chat with our team on every campaign. Bank details, proof of payment, status — all in one thread.' },
];

const TESTIMONIALS = [
  { name: 'Adaora Okeke',  role: 'Tech reviewer · Lagos',           quote: 'Hit 1,000 in 11 days. AdSense kicked in on day 14. Wish I\'d found this sooner.' },
  { name: 'Marcus Wong',   role: 'Vlogger · Toronto',               quote: 'Watching the count tick up in the dashboard was oddly satisfying. Every sub was real — checked the API logs myself.' },
  { name: 'Priya Sharma',  role: 'Music channel · Mumbai',          quote: 'The transparency is what sold me. Pinned payment instructions, signed receipts. Felt like a normal vendor.' },
  { name: 'Liam O\'Brien', role: 'Gaming channel · Dublin',         quote: 'I was skeptical about anything subscriber-related. The fact that they only pay workers after a YouTube API verification flipped me.' },
  { name: 'Sofia Reyes',   role: 'Cooking · Mexico City',           quote: 'Smaller package first to test, then scaled up. Both campaigns landed clean. No demonetization warnings, two years later.' },
  { name: 'Aisha Hassan',  role: 'Education · Nairobi',             quote: 'Got me past the threshold with two days to spare on a brand-deal deadline. Replied in chat within minutes both times.' },
];

const FAQS = CREATOR_FAQS;

export default function CreatorLandingPage() {
  const [count, setCount] = useState(1000);
  const price = calculateTotalPrice(count);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Subtle background grid */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#1e3a8a18_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(14,165,233,0.18),transparent_70%)]" />

      <Navbar cohort="creator" />
      <TelegramBack href="/" />

      {/* ───────── Hero ───────────────────────────────────────────────── */}
      <Section className="pt-32 md:pt-40">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="mb-6"><Eyebrow>For Creators</Eyebrow></div>
            <SectionHeading asH1>
              The fastest legitimate way to{' '}
              <Highlight>1,000 subscribers</Highlight>.
            </SectionHeading>
            <div className="mt-8">
              <Lead>
                Predictable pricing. Real people. Every subscription verified by the YouTube
                Data API. Reach monetization without bots, without risk, without waiting years
                for organic reach.
              </Lead>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup/client"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 px-7 py-4 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(34,211,238,0.45)] transition"
              >
                Start a campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-4 rounded-2xl border border-white/10 hover:border-white/30 text-white/80 hover:text-white transition"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Visual: stylized analytics card */}
          <div className="md:col-span-5">
            <Card tone="cyan" className="relative overflow-hidden">
              <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest">Live campaign</p>
                    <p className="text-white font-semibold mt-1">@channelname</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest font-bold">Live</span>
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-white/60 text-sm">Verified subscribers</p>
                  <p className="text-5xl font-black tabular-nums">
                    <Highlight>847</Highlight>
                    <span className="text-white/40 text-2xl"> / 1,000</span>
                  </p>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-blue-500 rounded-full" style={{ width: '84.7%' }} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { v: '24', l: 'Last hour' },
                    { v: '6d', l: 'Elapsed' },
                    { v: '3d', l: 'ETA' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-slate-950/40 border border-white/5 py-3">
                      <p className="text-lg font-bold text-white">{s.v}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ───────── How it works ───────────────────────────────────────── */}
      <Section className="pt-0" >
        <div id="how-it-works" className="text-center mb-14">
          <div className="mb-4"><Eyebrow>How it works</Eyebrow></div>
          <SectionHeading align="center">
            Four steps. <Highlight>No surprises.</Highlight>
          </SectionHeading>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <Card key={i} tone="cyan" className="h-full">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 mb-5">
                <s.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-2">Step {i + 1}</p>
              <h3 className="text-white text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ───────── Pricing ─────────────────────────────────────────────── */}
      <Section>
        <div className="text-center mb-14">
          <div className="mb-4"><Eyebrow>Pricing</Eyebrow></div>
          <SectionHeading align="center">
            Pay once. <Highlight>Get results.</Highlight>
          </SectionHeading>
          <div className="mt-6"><Lead align="center">Flat per-subscriber pricing. No subscriptions, no upsells, no surprises.</Lead></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {PRICING_PACKAGES.map((pkg) => (
            <Card key={pkg.name} tone={pkg.popular ? 'cyan' : 'neutral'} className={`relative h-full text-center ${pkg.popular ? 'ring-1 ring-cyan-400/50 shadow-[0_30px_60px_-20px_rgba(34,211,238,0.45)]' : ''}`}>
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-bold uppercase tracking-widest text-white whitespace-nowrap">
                  Most picked
                </span>
              )}
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">{pkg.name}</p>
              <p className="text-4xl font-black text-white mb-1">
                <Highlight>{formatCurrency(pkg.price)}</Highlight>
              </p>
              <p className="text-white/60 text-sm mb-6">{formatNumber(pkg.subscribers)} subscribers</p>
              <Link
                href={`/signup/client?package=${pkg.subscribers}`}
                className={`inline-flex w-full items-center justify-center py-3 rounded-xl font-semibold transition ${
                  pkg.popular
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white hover:from-cyan-300 hover:to-blue-400'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                Get started
              </Link>
            </Card>
          ))}
        </div>

        {/* Custom calculator */}
        <div className="max-w-2xl mx-auto">
          <Card tone="cyan">
            <p className="text-white/60 text-sm uppercase tracking-widest mb-2 text-center">Custom amount</p>
            <p className="text-white text-2xl font-bold text-center mb-6">
              Need <span className="text-cyan-300">{formatNumber(count)}</span>? Slide it.
            </p>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${((count - 100) / 4900) * 100}%, #1e293b ${((count - 100) / 4900) * 100}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-white/40 mt-2">
              <span>100</span>
              <span>5,000</span>
            </div>
            <div className="mt-6 rounded-xl bg-slate-950/40 border border-white/10 p-5 flex items-center justify-between">
              <span className="text-white/70 text-sm">Total</span>
              <span className="text-3xl font-black text-white"><Highlight>{formatCurrency(price)}</Highlight></span>
            </div>
            <Link
              href={`/signup/client?subscribers=${count}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 py-4 text-white font-semibold transition"
            >
              Order {formatNumber(count)} subscribers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </Section>

      {/* ───────── Features ───────────────────────────────────────────── */}
      <Section>
        <div className="text-center mb-14">
          <div className="mb-4"><Eyebrow>Why it works</Eyebrow></div>
          <SectionHeading align="center">
            Four things <Highlight>most growth services miss.</Highlight>
          </SectionHeading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <Card key={i} tone="neutral" className="h-full">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 mb-5">
                <f.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="text-white text-base font-bold mb-2">{f.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ───────── Testimonials ──────────────────────────────────────── */}
      <Section>
        <div className="text-center mb-14">
          <div className="mb-4"><Eyebrow>Creators talking</Eyebrow></div>
          <SectionHeading align="center">
            What happens after <Highlight>1,000</Highlight>.
          </SectionHeading>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} tone="neutral" className="h-full flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-300 fill-amber-300" />
                ))}
              </div>
              <p className="text-white/85 italic leading-relaxed flex-1">“{t.quote}”</p>
              <div className="flex items-center gap-3 mt-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm">
                  {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ───────── FAQ ───────────────────────────────────────────────── */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="mb-4"><Eyebrow>FAQ</Eyebrow></div>
            <SectionHeading align="center">
              Questions, <Highlight>answered.</Highlight>
            </SectionHeading>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/10 open:border-cyan-400/40 transition-colors"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between p-5 md:p-6">
                  <span className="text-white font-semibold text-base md:text-lg pr-6">{f.q}</span>
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/70 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 md:px-6 pb-6 text-white/70 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────── Final CTA ───────────────────────────────────────────── */}
      <Section className="pt-0 pb-32">
        <Card tone="cyan" className="relative overflow-hidden text-center py-14 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(34,211,238,0.18),transparent_70%)]" />
          <div className="relative">
            <div className="mb-6"><Eyebrow>Ready when you are</Eyebrow></div>
            <SectionHeading align="center">
              Hit your <Highlight>1,000</Highlight>.
            </SectionHeading>
            <p className="text-white/70 mt-5 max-w-xl mx-auto">No bots. No risk. Just real subscribers — verified, one at a time.</p>
            <Link
              href="/signup/client"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-8 py-4 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(34,211,238,0.45)] transition"
            >
              Start a campaign
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-xs text-white/40">
              Already have an account?{' '}
              <Link href="/login/client" className="text-white/70 hover:text-white underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </Section>

      {/* ───────── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Highzcore</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
