'use client';

// Dashboard-level "you haven't granted YouTube yet" prompt.
//
// Two surfaces:
//   * `compact` — a glassy banner that sits above the worker dashboard until
//     access is granted. Same brand language as the rest of the dashboard.
//   * default — a centered full card (used when there's room for one).
//
// Either CTA opens a guide modal that walks the worker through the four
// Google screens BEFORE redirecting. No more cold-jumping into a "Choose an
// account" page without context.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Shield,
  Sparkles,
  X,
  Play as Youtube,
} from 'lucide-react';
import GoogleGrantExplainer from '@/components/worker/GoogleGrantExplainer';

interface Props {
  onAccessGranted?: () => void;
  compact?: boolean;
}

export default function GrantYouTubeAccess({ compact = false }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  const continueToGoogle = async () => {
    try {
      setRedirecting(true);
      setError('');
      const res = await fetch('/api/request-youtube-access');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Failed to start YouTube authorization');
      }
      const data = await res.json();
      window.location.href = data.oauthUrl;
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong starting the grant');
      setRedirecting(false);
    }
  };

  // ── Compact banner (top of dashboard) ──────────────────────────────────
  if (compact) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-900/60 backdrop-blur-md p-5 md:p-6 shadow-[0_20px_60px_-15px_rgba(251,191,36,0.35)]"
          style={{
            // Pulsing border glow draws the eye even when the user is
            // scrolling past — this banner is a real gate, not a hint.
            animation: 'hzcr-attn 2.6s ease-in-out infinite',
          }}
        >
          {/* warning glow */}
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-4 flex-col sm:flex-row sm:items-center">
            {/* Icon: lock with a pulsing red dot on top to scream "blocked" */}
            <div className="relative flex-shrink-0">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_12px_30px_-10px_rgba(251,191,36,0.7)]">
                <Lock className="h-6 w-6 text-slate-950" strokeWidth={2.5} />
              </div>
              {/* live "attention" dot */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inset-0 inline-flex rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 ring-2 ring-slate-950" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Required badge */}
              <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-[10px] font-black uppercase tracking-[0.2em]">
                <AlertTriangle className="h-3 w-3" />
                Action required
              </div>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">
                Your tasks are locked.
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Connect your YouTube account once so we can verify your work and pay you. <span className="text-white font-semibold">You can't claim or earn until this is done.</span>
              </p>
            </div>

            <button
              onClick={() => setShowGuide(true)}
              className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 px-6 py-3 text-slate-950 font-black text-sm shadow-[0_12px_28px_-8px_rgba(251,191,36,0.7)] transition cursor-pointer whitespace-nowrap"
            >
              Unlock now
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>

          <style>{`
            @keyframes hzcr-attn {
              0%, 100% { box-shadow: 0 20px 60px -15px rgba(251, 191, 36, 0.35), 0 0 0 0 rgba(251, 191, 36, 0); }
              50%      { box-shadow: 0 20px 60px -15px rgba(251, 191, 36, 0.55), 0 0 0 6px rgba(251, 191, 36, 0.08); }
            }
          `}</style>
        </motion.div>

        <GrantGuideModal
          open={showGuide}
          onClose={() => setShowGuide(false)}
          onContinue={continueToGoogle}
          redirecting={redirecting}
          error={error}
        />
      </>
    );
  }

  // ── Full card variant ──────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-slate-900/70 to-slate-900/50 backdrop-blur-md p-8 max-w-md mx-auto text-center"
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_18px_40px_-12px_rgba(59,130,246,0.5)] mb-5">
            <Youtube className="h-6 w-6 text-white" />
          </div>

          <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">One-time setup</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-2">
            Connect your YouTube account
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-6">
            We need permission to confirm your subscriptions on your behalf. It's read-only — and a one-time grant.
          </p>

          <ul className="text-left space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Instant verification</p>
                <p className="text-white/55 text-xs">Tasks credit your wallet within seconds.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Read-only & private</p>
                <p className="text-white/55 text-xs">We can only check your subscriptions — nothing else.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">Once and done</p>
                <p className="text-white/55 text-xs">Grant once, works for every future task.</p>
              </div>
            </li>
          </ul>

          <button
            onClick={() => setShowGuide(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer"
          >
            Show me how
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <GrantGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        onContinue={continueToGoogle}
        redirecting={redirecting}
        error={error}
      />
    </>
  );
}

// ── The standalone guide modal ───────────────────────────────────────────

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  redirecting: boolean;
  error: string;
}

function GrantGuideModal({ open, onClose, onContinue, redirecting, error }: GuideModalProps) {
  return (
    <AnimatePresence>
      {open && (
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
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 md:p-8">
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">First-time setup</p>
              <h2 className="text-2xl font-black text-white leading-tight mb-4">
                Connect your YouTube account.
              </h2>

              <GoogleGrantExplainer />

              <button
                onClick={onContinue}
                disabled={redirecting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 py-3 px-4 text-white font-semibold text-sm transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {redirecting ? 'Redirecting to Google…' : 'I understand — continue to Google'}
                {!redirecting && <ArrowRight className="h-4 w-4" />}
              </button>
              {error && (
                <p className="mt-3 text-xs text-red-300">{error}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
