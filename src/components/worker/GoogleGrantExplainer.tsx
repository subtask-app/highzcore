// The "here's what you'll see on Google's screens" walk-through.
//
// Used in two places:
//   1. TaskFlowModal phase 2, when the worker starts a task and hasn't
//      granted YouTube access yet.
//   2. The standalone guide modal that fires from the dashboard's
//      "Grant YouTube access" banner.
//
// This is a guided presentation, not a wall of text — each step shows a tiny
// mock of the real Google screen so nothing is a surprise, and the tone is
// calm and reassuring. The "Google hasn't verified this app" screen scares
// people off; the whole job of this component is to make sure it doesn't.
//
// Content-only — the parent owns the continue/cancel button.

import type { ReactNode } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

// ── A tiny mock of a phone screen ────────────────────────────────────────────
// Gives the user a visual they'll recognise when the real screen appears.
function ScreenMock({ chrome, children }: { chrome: string; children: ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 overflow-hidden">
      {/* faux browser chrome */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border-b border-white/10">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-1.5 text-[10px] text-white/40 truncate">{chrome}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// A faux button — `hot` highlights the one the user should tap.
function MockBtn({ children, hot = false }: { children: ReactNode; hot?: boolean }) {
  return (
    <span
      className={
        hot
          ? 'inline-block rounded-md px-2.5 py-1 text-[11px] font-bold bg-blue-500 text-white ring-2 ring-blue-300/50'
          : 'inline-block rounded-md px-2.5 py-1 text-[11px] font-medium bg-white/8 text-white/45'
      }
    >
      {children}
    </span>
  );
}

// One walk-through step.
function Step({
  n,
  title,
  action,
  mock,
  note,
}: {
  n: number;
  title: string;
  action: ReactNode;
  mock: ReactNode;
  note?: ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-black text-xs">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/65 text-xs leading-relaxed mt-0.5">{action}</p>
        {mock}
        {note && <p className="text-white/45 text-[11px] leading-relaxed mt-1.5">{note}</p>}
      </div>
    </li>
  );
}

export default function GoogleGrantExplainer() {
  return (
    <div>
      {/* Warm intro — set expectations, lower the heart rate. */}
      <p className="text-white/75 text-sm leading-relaxed mb-4">
        Quick heads-up before I send you to Google: one of the next screens
        looks scarier than it is. Stay with me — I'll tell you <em>exactly</em>{' '}
        what to tap on each one, and you'll be back here in about 20 seconds.
      </p>

      {/* The WHY — defuse the "unverified app" fear before they see it. */}
      <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
        <div className="flex gap-3 items-start">
          <ShieldCheck className="h-5 w-5 text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-100 font-bold text-sm mb-1">
              You'll see "Google hasn't verified this app." That's expected.
            </p>
            <p className="text-blue-100/80 text-xs leading-relaxed">
              It is <strong className="text-blue-50">not</strong> a virus warning. Google shows it for
              every new app that hasn't finished its formal review — a slow,
              paperwork-heavy process we're still in the queue for. Highzcore can
              only ever <strong className="text-blue-50">read which channels you're subscribed to</strong>.
              It cannot post, comment, subscribe, or change a single thing on
              your account.
            </p>
          </div>
        </div>
      </div>

      {/* The one mistake that silently breaks everything. */}
      <div className="mb-5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-100 font-bold text-sm mb-1">One golden rule: same account everywhere.</p>
            <p className="text-amber-100/85 text-xs leading-relaxed">
              The Google account you pick on these screens must be the same one
              you'll subscribe to channels with on YouTube. Pick a different one
              and we'll be checking the wrong account — your tasks won't verify.
            </p>
          </div>
        </div>
      </div>

      <p className="text-white/55 text-xs font-bold uppercase tracking-[0.2em] mb-3">
        What you'll see — 5 quick taps
      </p>

      <ol className="space-y-5">
        {/* Step 1 — the scary screen, collapsed. */}
        <Step
          n={1}
          title={'"Google hasn’t verified this app"'}
          action={<>This is the scary-looking one. Don't tap <strong className="text-white">Back to safety</strong> — that just cancels. Instead, tap <strong className="text-white">Advanced</strong> in the bottom-left corner.</>}
          mock={
            <ScreenMock chrome="accounts.google.com">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1">
                  <p className="text-white/80 text-[11px] font-semibold leading-snug">Google hasn't verified this app</p>
                  <div className="flex items-center justify-between mt-2">
                    <MockBtn hot>Advanced</MockBtn>
                    <MockBtn>Back to safety</MockBtn>
                  </div>
                </div>
              </div>
            </ScreenMock>
          }
        />

        {/* Step 2 — the (unsafe) link. */}
        <Step
          n={2}
          title={'Tap "Go to highzcore.tech (unsafe)"'}
          action={<>Once you tap Advanced, a small link appears at the bottom. Tap <strong className="text-white">Go to highzcore.tech (unsafe)</strong>.</>}
          mock={
            <ScreenMock chrome="accounts.google.com">
              <p className="text-white/45 text-[10px] mb-1.5">Hide Advanced</p>
              <span className="inline-block rounded-md px-2.5 py-1 text-[11px] font-bold bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/40 underline underline-offset-2">
                Go to highzcore.tech (unsafe)
              </span>
            </ScreenMock>
          }
          note={<>The word "unsafe" is just Google's default label for any app it hasn't reviewed yet — it's not a judgement about Highzcore. You're fine.</>}
        />

        {/* Step 3 — account picker. */}
        <Step
          n={3}
          title={'Pick your Google account'}
          action={<>Choose the account that matches the one you signed up here with, then tap <strong className="text-white">Continue</strong>. (Remember the golden rule above.)</>}
          mock={
            <ScreenMock chrome="accounts.google.com">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
                <span className="text-white/70 text-[11px]">you@gmail.com</span>
              </div>
              <div className="flex justify-end gap-1.5">
                <MockBtn>Cancel</MockBtn>
                <MockBtn hot>Continue</MockBtn>
              </div>
            </ScreenMock>
          }
        />

        {/* Step 4 — the consent / permission screen. */}
        <Step
          n={4}
          title={'The permission screen — tap "Continue"'}
          action={<>Google shows what Highzcore is asking for. Scroll down if needed and tap <strong className="text-white">Continue</strong>. This is the step that actually grants the read-only access.</>}
          mock={
            <ScreenMock chrome="accounts.google.com">
              <p className="text-white/70 text-[11px] leading-snug mb-2">
                highzcore.tech wants to <strong className="text-white/90">see your YouTube account</strong>
              </p>
              <div className="flex justify-end gap-1.5">
                <MockBtn>Cancel</MockBtn>
                <MockBtn hot>Continue</MockBtn>
              </div>
            </ScreenMock>
          }
        />

        {/* Step 5 — our success page. */}
        <Step
          n={5}
          title={'"YouTube connected" — you’re done'}
          action={<>Our own screen appears with a green check. Tap <strong className="text-white">Return to Telegram</strong> and come back here — your task picks up automatically. 🎉</>}
          mock={
            <ScreenMock chrome="highzcore.tech">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center h-5 w-5 rounded-md bg-emerald-500 text-white text-[11px]">✓</span>
                <span className="text-white/80 text-[11px] font-semibold">YouTube connected</span>
              </div>
              <div className="mt-2">
                <MockBtn hot>Return to Telegram</MockBtn>
              </div>
            </ScreenMock>
          }
        />
      </ol>

      <p className="text-white/55 text-xs leading-relaxed mt-5">
        That's the whole thing. Five taps, one time, and you never see these
        screens again. Ready when you are 👇
      </p>
    </div>
  );
}
