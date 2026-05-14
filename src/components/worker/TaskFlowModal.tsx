'use client';

// Full task lifecycle for a worker: brief → (optional) pre-grant explainer
// → subscribe → verify → result (approved | soft warning).
//
// Self-contained — the only thing the parent owns is `open`/`onClose` and
// the wallet refresh callback.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PartyPopper,
  X,
  Play as Youtube,
} from 'lucide-react';
import GoogleGrantExplainer from './GoogleGrantExplainer';
import {
  useTelegramBackButton,
  useTelegramMainButton,
  hapticTap,
  hapticBump,
  hapticSelect,
  hapticSuccess,
  hapticWarn,
  isInTelegram,
  openExternal,
} from '@/lib/telegram/webapp';
import { useYouTubeAccess } from '@/hooks/useYouTubeAccess';

export interface TaskFlowTask {
  contract_id: string;
  channel_name: string;
  channel_url: string;
  channel_image?: string;
  payout: number;
  target_subscribers: number;
  verified_count: number;
}

type Phase = 'brief' | 'grant' | 'grant-waiting' | 'subscribe' | 'verifying' | 'verified' | 'warning';

interface Props {
  open: boolean;
  task: TaskFlowTask | null;
  hasYouTubeAccess: boolean;
  /** initial phase override — used when auto-resuming from a Google callback */
  initialPhase?: Exclude<Phase, 'verifying' | 'verified' | 'warning'>;
  onClose: () => void;
  /** Called after a successful verification so the dashboard can refetch. */
  onVerified?: (result: { payout_amount?: number; new_balance?: number; contract_completed?: boolean }) => void;
}

export default function TaskFlowModal({ open, task, hasYouTubeAccess, initialPhase, onClose, onVerified }: Props) {
  const [phase, setPhase] = useState<Phase>('brief');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedPayload, setVerifiedPayload] = useState<{ payout_amount?: number; new_balance?: number; contract_completed?: boolean } | null>(null);

  // Live YouTube-access status — drives both the brief→subscribe gate and the
  // polling we do while the worker is granting access in an external browser.
  const { hasAccess: ytLive, refresh: refreshYt } = useYouTubeAccess();
  const accessGranted = hasYouTubeAccess || ytLive;

  // Reset phase whenever the modal opens for a new task.
  useEffect(() => {
    if (!open || !task) return;
    setVerifyError(null);
    setVerifiedPayload(null);
    if (initialPhase) {
      setPhase(initialPhase);
    } else {
      setPhase('brief');
    }
  }, [open, task?.contract_id, initialPhase]);

  // ── Step 1 → 2/3 transition: from brief, gate on YouTube access.
  const advanceFromBrief = () => {
    if (accessGranted) setPhase('subscribe');
    else setPhase('grant');
  };

  // ── Step 2: start the YouTube grant.
  //
  // Two very different paths:
  //   • Inside Telegram — Google blocks its OAuth screen in Telegram's mobile
  //     webview (Error 403: disallowed_useragent). So we open the OAuth URL in
  //     the EXTERNAL browser via tg.openLink(), then sit in 'grant-waiting'
  //     and poll until the callback has stored the token server-side.
  //   • On web — a normal full-page redirect works. We stash the contract id
  //     in localStorage so the dashboard can auto-resume this modal on return.
  const startYouTubeGrant = async () => {
    if (!task) return;
    const telegram = isInTelegram();
    try {
      const qs = new URLSearchParams({ claim: task.contract_id });
      if (telegram) qs.set('platform', 'telegram');
      const res = await fetch(`/api/request-youtube-access?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to start YouTube authorization');
      const data = await res.json();

      if (telegram) {
        // External browser — Telegram webview can't do Google OAuth.
        openExternal(data.oauthUrl);
        setPhase('grant-waiting');
        return;
      }
      // Web: full-page redirect, with auto-resume breadcrumb.
      try { window.localStorage.setItem('hzcr_pending_claim', task.contract_id); } catch {}
      window.location.href = data.oauthUrl;
    } catch (e: any) {
      setVerifyError(e?.message ?? 'Could not start YouTube grant');
    }
  };

  // While in 'grant-waiting', poll the server for the access flag flipping
  // true (the external-browser callback writes it). Advance automatically.
  useEffect(() => {
    if (phase !== 'grant-waiting') return;
    let cancelled = false;
    const tick = async () => {
      await refreshYt();
    };
    void tick();
    const interval = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(interval); void cancelled; };
  }, [phase, refreshYt]);

  // When the poll (or anything else) reports access while we're waiting,
  // jump straight to the subscribe step.
  useEffect(() => {
    if (phase === 'grant-waiting' && ytLive) {
      hapticSuccess();
      setPhase('subscribe');
    }
  }, [phase, ytLive]);

  // ── Step 4: verify.
  const verify = async () => {
    if (!task) return;
    setPhase('verifying');
    setVerifyError(null);
    try {
      const res = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: task.contract_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'youtube_access_required') {
          setPhase('grant');
          return;
        }
        throw new Error(data?.message ?? data?.error ?? `Verify failed (${res.status})`);
      }
      if (data.verified) {
        setVerifiedPayload({
          payout_amount: data.payout_amount,
          new_balance: data.new_balance,
          contract_completed: data.contract_completed,
        });
        setPhase('verified');
        onVerified?.(data);
      } else {
        setPhase('warning');
      }
    } catch (e: any) {
      setVerifyError(e?.message ?? 'Verification failed');
      setPhase('warning');
    }
  };

  // ── Telegram native UX — runs no-op outside Telegram. ──────────────────
  // BackButton (in Telegram's header) closes the modal.
  useTelegramBackButton(() => { hapticTap(); onClose(); }, open && !!task);

  // MainButton (Telegram's fixed bottom bar) maps to whatever the primary
  // action is on the current phase. Outside Telegram the in-app buttons stay
  // visible and do the same thing, so nothing breaks on web.
  const mainBtn = (() => {
    if (!open || !task) return { show: false, text: '', click: () => {} };
    switch (phase) {
      case 'brief':         return { show: true, text: 'Continue',                click: () => { hapticTap(); advanceFromBrief(); } };
      case 'grant':         return { show: true, text: 'Continue to Google',      click: () => { hapticTap(); startYouTubeGrant(); } };
      case 'grant-waiting': return { show: true, text: 'I\'ve connected — check', click: () => { hapticTap(); void refreshYt(); } };
      case 'subscribe':     return { show: true, text: 'I subscribed — verify',   click: () => { hapticBump(); verify(); } };
      case 'verifying':     return { show: true, text: 'Checking…',               click: () => {} };
      case 'verified':      return { show: true, text: 'Find another task',       click: () => { hapticTap(); onClose(); } };
      case 'warning':       return { show: true, text: 'Try again',               click: () => { hapticTap(); setPhase('subscribe'); } };
      default:              return { show: false, text: '', click: () => {} };
    }
  })();

  useTelegramMainButton({
    text: mainBtn.text || ' ',
    onClick: mainBtn.click,
    show: mainBtn.show,
    progress: phase === 'verifying' || phase === 'grant-waiting',
    disabled: phase === 'verifying',
  });

  // Haptics on terminal-phase transitions.
  useEffect(() => {
    if (phase === 'verified') hapticSuccess();
    else if (phase === 'warning') hapticWarn();
    else if (phase === 'subscribe' || phase === 'grant') hapticSelect();
  }, [phase]);

  // ── Render guard
  if (!open || !task) return null;

  const remaining = Math.max(task.target_subscribers - task.verified_count, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          className="scrollbar-none relative w-full max-w-md bg-slate-900 border border-blue-500/30 rounded-3xl overflow-y-auto overflow-x-hidden break-words shadow-[0_30px_80px_-20px_rgba(59,130,246,0.4)]"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 md:p-8">
            {/* ── PHASE 1: Brief ───────────────────────────────────────── */}
            {phase === 'brief' && (
              <>
                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">Task brief</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-2">Subscribe & earn</h2>

                {/* Task summary card */}
                <div className="mt-5 rounded-2xl bg-slate-950/50 border border-white/5 p-4 flex items-center gap-3">
                  {task.channel_image ? (
                    <img src={task.channel_image} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center">
                      <Youtube className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{task.channel_name}</p>
                    <p className="text-xs text-white/50 truncate">{task.channel_url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Payout</p>
                    <p className="text-blue-300 font-black">₦{task.payout}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-950/50 border border-white/5 p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Slots left</p>
                    <p className="text-white font-bold">{remaining.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 border border-white/5 p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Target</p>
                    <p className="text-white font-bold">{task.target_subscribers.toLocaleString()}</p>
                  </div>
                </div>

                {/* Instructions */}
                <ol className="mt-6 space-y-2.5">
                  {[
                    'You\'ll open the channel in a new tab.',
                    'Tap Subscribe with the same Google account you signed up here with.',
                    'Come back to this modal and tap "I subscribed — verify".',
                    'YouTube confirms instantly. ₦' + task.payout + ' lands in your wallet.',
                  ].map((line, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-white/75">
                      <span className="flex-shrink-0 h-5 w-5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black grid place-items-center mt-0.5">{i + 1}</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>

                <button
                  onClick={advanceFromBrief}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* ── PHASE 2: Pre-grant explainer ──────────────────────────── */}
            {phase === 'grant' && (
              <>
                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">First-time setup</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-4">
                  Let's connect your YouTube account.
                </h2>

                <GoogleGrantExplainer />

                <button
                  onClick={startYouTubeGrant}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer"
                >
                  I understand — continue to Google
                  <ArrowRight className="h-4 w-4" />
                </button>
                {verifyError && (
                  <p className="mt-3 text-xs text-red-300">{verifyError}</p>
                )}
              </>
            )}

            {/* ── PHASE 2b: Waiting for the external-browser grant (Telegram) ─ */}
            {phase === 'grant-waiting' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-5">
                  <Loader2 className="h-7 w-7 text-blue-300 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-white leading-tight mb-2">
                  Finish in your browser…
                </h2>
                <p className="text-white/65 text-sm leading-relaxed mb-5">
                  We opened Google sign-in in your phone's browser — Telegram can't
                  show it directly. Approve YouTube access there, then come back to
                  Telegram. This screen updates on its own the moment you're done.
                </p>
                <div className="rounded-xl bg-slate-950/50 border border-white/10 p-3 mb-5 text-left">
                  <p className="text-xs text-white/55 leading-relaxed">
                    Didn't see a browser open? Tap below to try again, or check
                    your other browser tabs for the Google screen.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => { hapticTap(); void refreshYt(); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-2.5 px-4 text-white font-semibold text-sm transition cursor-pointer"
                  >
                    I've connected — check now
                  </button>
                  <button
                    onClick={() => { hapticTap(); startYouTubeGrant(); }}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/10 text-white/65 hover:text-white hover:border-white/25 transition cursor-pointer text-sm"
                  >
                    Reopen
                  </button>
                </div>
                {verifyError && (
                  <p className="mt-3 text-xs text-red-300">{verifyError}</p>
                )}
              </div>
            )}

            {/* ── PHASE 3: Subscribe ─────────────────────────────────────── */}
            {phase === 'subscribe' && (
              <>
                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">Do the task</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-3">
                  Subscribe to {task.channel_name}.
                </h2>
                <p className="text-white/65 text-sm leading-relaxed mb-5">
                  Open the channel below, tap the red <strong className="text-white">Subscribe</strong> button on YouTube, then come back and verify.
                </p>

                <a
                  href={task.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 p-4 mb-5 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {task.channel_image ? (
                      <img src={task.channel_image} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{task.channel_name}</p>
                      <p className="text-xs text-white/55 truncate">Opens in a new tab</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-blue-300" />
                  </div>
                </a>

                <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 mb-5 text-xs text-amber-100 leading-relaxed">
                  Make sure you're signed into YouTube with the same Google account you signed up with here. Otherwise verification will fail.
                </div>

                <button
                  onClick={verify}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I subscribed — verify my task
                </button>
              </>
            )}

            {/* ── PHASE 4: Verifying ─────────────────────────────────────── */}
            {phase === 'verifying' && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-5">
                  <Loader2 className="h-7 w-7 text-blue-300 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-white leading-tight mb-2">
                  Checking YouTube…
                </h2>
                <p className="text-white/65 text-sm leading-relaxed">
                  Asking the YouTube Data API if your subscription is in. This usually takes 2–3 seconds.
                </p>
              </div>
            )}

            {/* ── PHASE 5a: Verified ─────────────────────────────────────── */}
            {phase === 'verified' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-5">
                  <PartyPopper className="h-7 w-7 text-emerald-300" />
                </div>
                <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">Approved</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-2">
                  ₦{verifiedPayload?.payout_amount ?? task.payout} added to your wallet.
                </h2>
                <p className="text-white/65 text-sm leading-relaxed mb-6">
                  Your subscription to {task.channel_name} was verified. {verifiedPayload?.contract_completed
                    ? 'You just helped this creator hit their target — nice.'
                    : 'Move on to the next one anytime.'}
                </p>

                {typeof verifiedPayload?.new_balance === 'number' && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-4 mb-6">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-widest">New balance</p>
                    <p className="text-3xl font-black text-white tabular-nums mt-1">
                      ₦{verifiedPayload.new_balance.toLocaleString()}
                    </p>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer"
                >
                  Find another task
                </button>
              </div>
            )}

            {/* ── PHASE 5b: Warm warning ─────────────────────────────────── */}
            {phase === 'warning' && (
              <>
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-400/10 border border-amber-400/30 mb-4">
                    <AlertTriangle className="h-7 w-7 text-amber-300" />
                  </div>
                  <p className="text-amber-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">A quick word</p>
                  <h2 className="text-2xl font-black text-white leading-tight">
                    We didn't see the subscription yet.
                  </h2>
                </div>

                <p className="text-white/75 text-sm leading-relaxed mb-3">
                  Two possibilities — and we want to handle both fairly.
                </p>

                <ul className="space-y-3 mb-5 text-sm text-white/75">
                  <li className="rounded-xl bg-slate-950/40 border border-white/5 p-3">
                    <p className="font-semibold text-white mb-1">You did subscribe.</p>
                    <p className="text-white/65 leading-relaxed text-[13px]">
                      YouTube sometimes takes a minute to update its API. Wait ~60 seconds and tap "Try again". Most of the time it'll go through.
                    </p>
                  </li>
                  <li className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3">
                    <p className="font-semibold text-amber-100 mb-1">You marked it done without subscribing.</p>
                    <p className="text-amber-100/85 leading-relaxed text-[13px]">
                      We've sent you a gentle reminder email. Repeated unverified submissions can pause your withdrawals — please subscribe before tapping "I'm done".
                    </p>
                  </li>
                </ul>

                {verifyError && (
                  <p className="text-xs text-red-300 mb-3">{verifyError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => { setPhase('subscribe'); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-2.5 px-4 text-white font-semibold text-sm transition cursor-pointer"
                  >
                    Try again
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-white/10 text-white/65 hover:text-white hover:border-white/25 transition cursor-pointer text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
