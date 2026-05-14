'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Globe,
  PlayCircle,
  Shield,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/brand/Navbar';
import Logo from '@/components/brand/Logo';
import TelegramBack from '@/components/telegram/TelegramBack';
import { Card, Eyebrow, Highlight, Lead, Section, SectionHeading } from '@/components/brand/primitives';
import { WORKER_PAYOUT_PER_TASK, MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants';
import { WORKER_FAQS } from '@/lib/seo/faqs';

const STEPS = [
  { icon: Wallet,        title: 'Sign up free',     desc: 'One Google sign-in. We use it just to verify your subscriptions — nothing else.' },
  { icon: PlayCircle,    title: 'Claim a task',     desc: 'Browse paid tasks, pick one, subscribe to the channel from your Google account.' },
  { icon: CheckCircle2,  title: 'Get verified',     desc: 'We call YouTube\'s API to confirm. Within seconds your wallet is credited.' },
  { icon: Banknote,      title: 'Cash out',         desc: `Withdraw to your bank from ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}. Paid in 3 business days.` },
];

const FEATURES = [
  { icon: Wallet,    title: `₦${WORKER_PAYOUT_PER_TASK} per task`,  desc: 'Flat payout per verified subscription. No bidding, no fluctuating rates.' },
  { icon: Clock,     title: 'Work any time',                         desc: 'New tasks appear 24/7. Pick what fits your schedule, ignore the rest.' },
  { icon: Globe,     title: 'Work from anywhere',                    desc: 'Open to workers globally. Any device, any country — as long as you have a Google account and bank.' },
  { icon: Shield,    title: 'Safe for your account',                 desc: 'Real subscriptions only — no scripts, no automation. Your Google account stays in good standing.' },
];

const TESTIMONIALS = [
  { name: 'Jamal Ahmed',    role: 'Student · Manila',       quote: 'Started with two tasks during lunch. A month in, I\'m clearing about ₦40k in side income. Withdrawals always hit my bank in two days.' },
  { name: 'Tunde Adekola',  role: 'Side hustle · Abuja',    quote: 'I treat this like a 30-minute morning routine. Three years of looking for online work I could actually trust — this one paid out the first week.' },
  { name: 'Lara Mendes',    role: 'Designer · São Paulo',   quote: 'Tasks are quick, the verification is instant, the dashboard tells me exactly where my money is. That\'s really all I want from a side gig.' },
  { name: 'Hannah Park',    role: 'Stay-at-home · Seoul',   quote: 'I do about ten tasks a day while my kid naps. By the end of the month it\'s real grocery money.' },
  { name: 'Daniel Petrov',  role: 'Between jobs · Sofia',   quote: 'Fast onboarding. Real money. Real transparency. Built like an engineer made it, not a marketer.' },
  { name: 'Ngozi Eze',      role: 'Freelancer · Lagos',     quote: 'I refer friends to it now. Watching someone go from sign-up to first payout in 20 minutes never gets old.' },
];

const FAQS = WORKER_FAQS;

export default function WorkerLandingPage() {
  const [tasksPerDay, setTasksPerDay] = useState(10);
  const daily = tasksPerDay * WORKER_PAYOUT_PER_TASK;
  const weekly = daily * 6;
  const monthly = daily * 25;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#1e3a8a18_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(59,130,246,0.2),transparent_70%)]" />

      <Navbar cohort="worker" />
      <TelegramBack href="/" />

      {/* ───────── Hero ──────────────────────────────────────────────── */}
      <Section className="pt-32 md:pt-40">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="mb-6"><Eyebrow tone="blue">For Workers</Eyebrow></div>
            <SectionHeading asH1>
              Get paid <Highlight>₦{WORKER_PAYOUT_PER_TASK}</Highlight>{' '}
              every time you subscribe to a channel.
            </SectionHeading>
            <div className="mt-8">
              <Lead>
                No tricks. No scripts. Real money for clicking subscribe with your Google
                account. Work whenever you want, withdraw whenever you want.
              </Lead>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup/worker"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 px-7 py-4 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(59,130,246,0.5)] transition"
              >
                Start earning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#calculator"
                className="inline-flex items-center justify-center px-6 py-4 rounded-2xl border border-white/10 hover:border-white/30 text-white/80 hover:text-white transition"
              >
                See the numbers
              </a>
            </div>
          </div>

          {/* Visual: wallet card */}
          <div className="md:col-span-5">
            <Card tone="blue" className="relative overflow-hidden">
              <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest">Your wallet</p>
                    <p className="text-white font-semibold mt-1">Today</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-widest font-bold">Live</span>
                </div>

                <p className="text-white/60 text-sm">Balance</p>
                <p className="text-5xl font-black tabular-nums mb-6">
                  <Highlight>₦{(WORKER_PAYOUT_PER_TASK * 14).toLocaleString()}</Highlight>
                </p>

                <div className="space-y-2">
                  {[
                    { ch: '@productivelab',     amt: WORKER_PAYOUT_PER_TASK },
                    { ch: '@yumcooks',          amt: WORKER_PAYOUT_PER_TASK },
                    { ch: '@morninggameplay',   amt: WORKER_PAYOUT_PER_TASK },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-white/5 grid place-items-center">
                          <PlayCircle className="h-4 w-4 text-blue-300" />
                        </span>
                        <p className="text-white text-sm">{r.ch}</p>
                      </div>
                      <p className="text-emerald-300 font-bold text-sm">+₦{r.amt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ───────── How it works ───────────────────────────────────────── */}
      <Section className="pt-0">
        <div className="text-center mb-14">
          <div className="mb-4"><Eyebrow tone="blue">How it works</Eyebrow></div>
          <SectionHeading align="center">
            From sign-up to <Highlight>first payout</Highlight> in under an hour.
          </SectionHeading>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <Card key={i} tone="blue" className="h-full">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-500/15 border border-blue-500/30 mb-5">
                <s.icon className="h-5 w-5 text-blue-300" />
              </div>
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Step {i + 1}</p>
              <h3 className="text-white text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ───────── Earnings calculator ─────────────────────────────────── */}
      <Section>
        <div id="calculator" className="text-center mb-14">
          <div className="mb-4"><Eyebrow tone="blue">Earnings</Eyebrow></div>
          <SectionHeading align="center">
            Project your <Highlight>monthly take</Highlight>.
          </SectionHeading>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card tone="blue">
            <p className="text-white/60 text-sm uppercase tracking-widest mb-2 text-center">Tasks per day</p>
            <p className="text-white text-2xl font-bold text-center mb-6">
              At <span className="text-blue-300">{tasksPerDay}</span> {tasksPerDay === 1 ? 'task' : 'tasks'} a day
            </p>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={tasksPerDay}
              onChange={(e) => setTasksPerDay(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${((tasksPerDay - 1) / 59) * 100}%, #1e293b ${((tasksPerDay - 1) / 59) * 100}%, #1e293b 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-white/40 mt-2">
              <span>1</span>
              <span>60</span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Daily',   amount: daily },
                { label: 'Weekly',  amount: weekly },
                { label: 'Monthly', amount: monthly },
              ].map((row, i) => (
                <div key={i} className="rounded-xl bg-slate-950/40 border border-white/10 py-5">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{row.label}</p>
                  <p className={`mt-1 font-black text-white ${i === 2 ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                    ₦{row.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/signup/worker"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-4 text-white font-semibold transition"
            >
              Start earning today
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-white/40">
              Based on ₦{WORKER_PAYOUT_PER_TASK}/task, 6 working days/week, 25 days/month.
            </p>
          </Card>
        </div>
      </Section>

      {/* ───────── Features ──────────────────────────────────────────── */}
      <Section>
        <div className="text-center mb-14">
          <div className="mb-4"><Eyebrow tone="blue">Why it works</Eyebrow></div>
          <SectionHeading align="center">
            What makes this <Highlight>different</Highlight>.
          </SectionHeading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <Card key={i} tone="neutral" className="h-full">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-500/15 border border-blue-500/30 mb-5">
                <f.icon className="h-5 w-5 text-blue-300" />
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
          <div className="mb-4"><Eyebrow tone="blue">Workers talking</Eyebrow></div>
          <SectionHeading align="center">
            Real workers. <Highlight>Real payouts.</Highlight>
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
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
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
            <div className="mb-4"><Eyebrow tone="blue">FAQ</Eyebrow></div>
            <SectionHeading align="center">
              Common <Highlight>questions</Highlight>.
            </SectionHeading>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/10 open:border-blue-400/40 transition-colors"
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

      {/* ───────── Final CTA ──────────────────────────────────────────── */}
      <Section className="pt-0 pb-32">
        <Card tone="blue" className="relative overflow-hidden text-center py-14 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" />
          <div className="relative">
            <div className="mb-6"><Eyebrow tone="blue">Less reading, more earning</Eyebrow></div>
            <SectionHeading align="center">
              Make your <Highlight>first ₦{WORKER_PAYOUT_PER_TASK}</Highlight> tonight.
            </SectionHeading>
            <p className="text-white/70 mt-5 max-w-xl mx-auto">Sign up takes one click. No interview. No upload. No CV.</p>
            <Link
              href="/signup/worker"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 px-8 py-4 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(59,130,246,0.5)] transition"
            >
              Sign up free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-xs text-white/40">
              Already have an account?{' '}
              <Link href="/login/worker" className="text-white/70 hover:text-white underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </Section>

      {/* ───────── Footer ─────────────────────────────────────────────── */}
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
