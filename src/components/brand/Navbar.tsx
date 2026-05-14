// Canonical landing-page navbar. Used on /, /for-clients, /for-workers,
// /privacy, /terms. Auth pages use a much simpler top-bar; dashboards have
// their own internal headers.
//
// Variants:
//   • `transparent` (default): fixed, no background — for pages with their
//     own hero/3D treatment. Goes solid on scroll via a small client island.
//   • `solid`: matte backdrop with border, no scroll behavior — use when the
//     page has no full-bleed hero behind the nav.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { isInTelegram, useTelegramReady } from '@/lib/telegram/webapp';

type Cohort = 'creator' | 'worker' | 'generic';
type Variant = 'transparent' | 'solid';

interface NavbarProps {
  cohort?: Cohort;
  variant?: Variant;
}

function ctaHref(cohort: Cohort): { signup: string; login: string; ctaLabel: string } {
  if (cohort === 'creator') return { signup: '/signup/client', login: '/login/client', ctaLabel: 'Get started' };
  if (cohort === 'worker')  return { signup: '/signup/worker', login: '/login/worker', ctaLabel: 'Start earning' };
  return { signup: '/signup/worker', login: '/login/worker', ctaLabel: 'Get started' };
}

export default function Navbar({ cohort = 'generic', variant = 'transparent' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const tgReady = useTelegramReady();
  // Hide marketing chrome when inside Telegram — Telegram supplies its own
  // header (close button, menu) and the redundant strip wastes vertical
  // space on phone screens.
  const insideTelegram = tgReady && isInTelegram();

  useEffect(() => {
    if (variant !== 'transparent') return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  if (insideTelegram) return null;

  const { signup, login, ctaLabel } = ctaHref(cohort);

  const baseShell = 'fixed top-0 inset-x-0 z-40 transition-colors duration-300';
  const surface =
    variant === 'solid'
      ? 'bg-slate-950/90 backdrop-blur-md border-b border-white/5'
      : scrolled
      ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/5'
      : 'bg-transparent border-b border-transparent';

  return (
    // Hide the whole nav when the app is running inside Telegram — Telegram
    // provides its own chrome (close button, menu) and a redundant top-nav
    // wastes vertical space on phone screens.
    <header className={`${baseShell} ${surface}`}>
      <nav className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Logo size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={login}
            className="hidden sm:inline-flex text-sm px-4 py-2 text-white/80 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            href={signup}
            className="inline-flex items-center justify-center text-sm px-4 py-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-semibold shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)] hover:shadow-[0_12px_28px_-6px_rgba(34,211,238,0.55)] transition"
          >
            {ctaLabel}
          </Link>
        </div>
      </nav>
    </header>
  );
}
