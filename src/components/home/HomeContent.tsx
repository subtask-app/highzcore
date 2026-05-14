// Server-rendered HTML story that scrolls over the fixed 3D background.
// SSR-friendly (no client hooks) so search engines see all the copy.

import Link from 'next/link';
import { ArrowRight, ChevronDown, TrendingUp, Wallet } from 'lucide-react';
import Navbar from '@/components/brand/Navbar';
import Logo from '@/components/brand/Logo';

const sectionBase = 'relative min-h-screen flex items-center px-6 md:px-12';

export default function HomeContent() {
  return (
    <main className="relative">
      {/* Canonical landing nav — transparent over the 3D hero,
          turns matte slate-950/80 once the user starts scrolling. */}
      <Navbar cohort="generic" variant="transparent" />

      {/* ─────── 1. Hero ──────────────────────────────────────────────────── */}
      <section className={sectionBase}>
        <div className="relative z-10 max-w-3xl mx-auto md:mx-0">
          <p className="text-cyan-300/80 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-6">
            Highzcore — YouTube Growth, the Honest Way
          </p>
          <h1 className="text-white text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
            Real subscribers. <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Real people.
            </span>
            <br />
            Real money.
          </h1>
          <p className="mt-8 text-base md:text-lg text-white/70 max-w-xl">
            A global two-sided marketplace where creators reach the 1,000-subscriber
            monetization line — and workers earn cash for every verified subscription.
          </p>
          <div className="mt-12 inline-flex items-center gap-2 text-white/60 text-sm">
            <span>Scroll to learn how</span>
            <ChevronDown
              className="h-4 w-4 text-cyan-300"
              style={{ animation: 'home-bounce 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* ─────── 2. The problem ───────────────────────────────────────────── */}
      <section className={sectionBase}>
        <div className="relative z-10 max-w-2xl ml-auto text-right">
          <p className="text-cyan-300/80 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-6">
            The 1,000-subscriber wall
          </p>
          <h2 className="text-white text-4xl md:text-6xl font-black leading-[1.0] tracking-tight">
            YouTube unlocks payments at 1,000 subs. <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Most channels stall there.
            </span>
          </h2>
          <p className="mt-8 text-base md:text-lg text-white/70">
            Without organic reach, getting to the threshold can take years. Bot farms exist, but
            they get flagged, demonetized, and banned. There's a better way.
          </p>
        </div>
      </section>

      {/* ─────── 3. The solution ──────────────────────────────────────────── */}
      <section className={sectionBase}>
        <div className="relative z-10 max-w-2xl mx-auto md:mx-0">
          <p className="text-cyan-300/80 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-6">
            A marketplace, not a bot farm
          </p>
          <h2 className="text-white text-4xl md:text-6xl font-black leading-[1.0] tracking-tight">
            Real Google accounts. <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Verified by YouTube itself.
            </span>
          </h2>
          <p className="mt-8 text-base md:text-lg text-white/70">
            Workers subscribe with their own Google accounts. Every subscription is verified
            through the official YouTube Data API — no shortcuts, no fakes, no risk of
            demonetization for the creator.
          </p>
        </div>
      </section>

      {/* ─────── 4. Both sides ────────────────────────────────────────────── */}
      <section className={sectionBase}>
        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-8 md:p-10">
            <p className="text-cyan-300 text-xs font-semibold uppercase tracking-[0.25em] mb-3">For Creators</p>
            <h3 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
              Pick a target. Pay once. Watch real subs come in.
            </h3>
            <ul className="space-y-3 text-white/75 text-sm md:text-base">
              <li className="flex gap-3"><span className="text-cyan-300">→</span> Predictable per-subscriber pricing, packages from 100 subs to 2,000+</li>
              <li className="flex gap-3"><span className="text-cyan-300">→</span> Manual payment confirmation, all evidence pinned in chat</li>
              <li className="flex gap-3"><span className="text-cyan-300">→</span> Live progress tracker — see your count climb in real time</li>
              <li className="flex gap-3"><span className="text-cyan-300">→</span> Every sub verified by the YouTube API</li>
            </ul>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-blue-500/20 rounded-2xl p-8 md:p-10">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-[0.25em] mb-3">For Workers</p>
            <h3 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
              Subscribe. Get paid. Cash out to your bank.
            </h3>
            <ul className="space-y-3 text-white/75 text-sm md:text-base">
              <li className="flex gap-3"><span className="text-blue-300">→</span> Fixed payout per verified task — no caps</li>
              <li className="flex gap-3"><span className="text-blue-300">→</span> Withdraw to your bank account on demand</li>
              <li className="flex gap-3"><span className="text-blue-300">→</span> One-time YouTube grant, then it just works</li>
              <li className="flex gap-3"><span className="text-blue-300">→</span> Pick from a live feed of paid tasks, work on your own schedule</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────── 5. Pick your side — the climax ──────────────────────────── */}
      <section className={`${sectionBase} pb-24`}>
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          <p className="text-cyan-300/80 text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-6">
            One choice. That's it.
          </p>
          <h2 className="text-white text-4xl md:text-6xl font-black leading-[1.0] tracking-tight mb-4">
            Which side are you on?
          </h2>
          <p className="text-white/60 text-base md:text-lg mb-12 max-w-xl mx-auto">
            You can always switch later. Pick the one that fits where you are right now.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creator card */}
            <Link
              href="/for-clients"
              className="group relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/40 backdrop-blur-md p-8 md:p-10 text-left transition-all hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-[0_30px_80px_-20px_rgba(34,211,238,0.45)]"
            >
              {/* glow accent */}
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl group-hover:bg-cyan-400/30 transition" />
              <div className="relative">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 mb-6 shadow-[0_8px_30px_rgba(34,211,238,0.45)]">
                  <TrendingUp className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-cyan-300 text-xs font-bold uppercase tracking-[0.25em] mb-2">I have a channel</p>
                <h3 className="text-white text-3xl md:text-4xl font-black mb-3 leading-tight">I'm a Creator</h3>
                <p className="text-white/70 text-sm md:text-base mb-8">
                  Get real subscribers on your YouTube channel and reach monetization faster.
                </p>
                <span className="inline-flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                  Start a campaign
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {/* Worker card */}
            <Link
              href="/for-workers"
              className="group relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-slate-900/60 to-slate-900/40 backdrop-blur-md p-8 md:p-10 text-left transition-all hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-[0_30px_80px_-20px_rgba(59,130,246,0.45)]"
            >
              {/* glow accent */}
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-400/30 transition" />
              <div className="relative">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 mb-6 shadow-[0_8px_30px_rgba(59,130,246,0.45)]">
                  <Wallet className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.25em] mb-2">I want to earn</p>
                <h3 className="text-white text-3xl md:text-4xl font-black mb-3 leading-tight">I'm a Worker</h3>
                <p className="text-white/70 text-sm md:text-base mb-8">
                  Get paid for every verified YouTube subscription. Work whenever you want.
                </p>
                <span className="inline-flex items-center gap-2 text-blue-300 font-semibold text-sm">
                  Browse tasks
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>

          <p className="mt-10 text-xs text-white/40">
            Already have an account? <Link href="/login/client" className="text-white/70 hover:text-white underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </div>
      </section>

      {/* Footer — same lockup as the other marketing pages */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Highzcore</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes home-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(4px); }
        }
        /* Keep headlines crisp over a moving 3D background. */
        main > section h1,
        main > section h2 {
          text-shadow: 0 2px 28px rgba(2, 6, 23, 0.65), 0 0 1px rgba(2, 6, 23, 0.4);
        }
        main > section p {
          text-shadow: 0 1px 16px rgba(2, 6, 23, 0.55);
        }
        /* The role-picker cards have their own backdrop so don't double-shadow text inside them. */
        main > section a.group h3,
        main > section a.group p {
          text-shadow: none;
        }
      `}</style>
    </main>
  );
}
