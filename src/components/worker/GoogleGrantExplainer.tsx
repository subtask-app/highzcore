// The "here's what you'll see on Google's screens" walkthrough.
// Used in two places:
//   1. TaskFlowModal phase 2, when the worker starts a task and hasn't
//      granted YouTube access yet.
//   2. The standalone guide modal that fires from the dashboard's
//      "Grant YouTube access" banner.
//
// Content-only — the parent owns the continue/cancel button.

import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export default function GoogleGrantExplainer() {
  return (
    <div>
      <p className="text-white/65 text-sm leading-relaxed mb-5">
        One-time setup so we can confirm your subscriptions. You'll see four Google screens — here's exactly what to do on each one.
      </p>

      {/* CRITICAL — same Google account everywhere. The single most common
          failure mode is granting with one account and subscribing with
          another. */}
      <div className="mb-5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-100 font-bold text-sm mb-1">Use the SAME Google account everywhere.</p>
            <p className="text-amber-100/85 text-xs leading-relaxed">
              The account you signed up here with → the one you pick on the next screen → the one you subscribe to channels with on YouTube. If they don't match, we'll be reading subscriptions on the wrong account and your tasks won't verify.
            </p>
          </div>
        </div>
      </div>

      <ol className="space-y-3 mb-2">
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 font-black text-xs">1</span>
          <div>
            <p className="text-white font-semibold text-sm">"Choose an account"</p>
            <p className="text-white/55 text-xs leading-relaxed">
              Pick the account whose email matches the one you signed up here with. If you don't see it, tap "Use another account" and sign in with it.
            </p>
          </div>
        </li>

        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-white font-semibold text-sm">"Google hasn't verified this app"</p>
            <p className="text-white/55 text-xs leading-relaxed">
              Don't bail out here — this is normal for newer apps. Tap <strong className="text-white">"Advanced"</strong> at the bottom-left, then the link that says <strong className="text-white">"Go to Highzcore (unsafe)"</strong>. (We're working on Google's full verification — it doesn't change what we can or can't see.)
            </p>
          </div>
        </li>

        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300">
            <Shield className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-white font-semibold text-sm">"Highzcore wants to see your YouTube account"</p>
            <p className="text-white/55 text-xs leading-relaxed">
              Read-only access — we can <em>only</em> check which channels you're subscribed to. We can't post, like, comment, subscribe, or change anything on your account.
            </p>
          </div>
        </li>

        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-white font-semibold text-sm">Tap "Continue" (or "Allow")</p>
            <p className="text-white/55 text-xs leading-relaxed">
              You'll bounce back here automatically.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
