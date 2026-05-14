// Typed accessor + React hooks for window.Telegram.WebApp.
//
// All entry points are safe outside Telegram — they no-op rather than throw.
//
// What's here:
//   * getTg()                — direct accessor with typing; null outside TMA
//   * useTelegramReady()     — boolean, true when WebApp is loaded
//   * useTelegramMainButton  — show/hide the bottom MainButton with a handler
//   * useTelegramBackButton  — show the top BackButton with a handler
//   * useTelegramHaptic      — fire haptic events
//   * useTelegramThemeSync   — copies tg.themeParams onto :root CSS variables

import { useEffect, useRef, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotificationType = 'success' | 'error' | 'warning';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_visible?: boolean; is_active?: boolean }) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: HapticImpactStyle) => void;
    notificationOccurred: (type: HapticNotificationType) => void;
    selectionChanged: () => void;
  };
  // Opens a URL in the user's EXTERNAL system browser (not the in-app
  // webview). Required for Google OAuth — Google rejects its OAuth pages
  // inside embedded webviews (Error 403: disallowed_useragent).
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  // Opens a t.me link inside Telegram.
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

// ── Direct accessor ─────────────────────────────────────────────────────────

export function getTg(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function isInTelegram(): boolean {
  return !!getTg()?.initData;
}

// Hydration-safe boolean: false on the server + first client render, then
// flips true after mount if we're inside Telegram. Use this for conditional
// rendering so SSR and the first client paint agree.
export function useIsTelegram(): boolean {
  const [inside, setInside] = useState(false);
  useEffect(() => { setInside(isInTelegram()); }, []);
  return inside;
}

// ── Ready hook (SDK script loads async; this waits for it) ──────────────────

export function useTelegramReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Telegram?.WebApp) { setReady(true); return; }
    // Poll briefly while the SDK script finishes loading.
    const t = setInterval(() => {
      if (window.Telegram?.WebApp) {
        setReady(true);
        clearInterval(t);
      }
    }, 80);
    const stop = setTimeout(() => clearInterval(t), 4000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, []);
  return ready;
}

// ── MainButton hook ─────────────────────────────────────────────────────────

interface MainButtonOpts {
  text: string;
  onClick: () => void;
  show?: boolean;
  disabled?: boolean;
  progress?: boolean;
  color?: string;       // hex like '#0EA5E9'
  textColor?: string;   // hex like '#FFFFFF'
}

export function useTelegramMainButton(opts: MainButtonOpts): void {
  // Keep the click handler stable so we don't churn Telegram's listener.
  const handlerRef = useRef<() => void>(() => {});
  handlerRef.current = opts.onClick;

  const { text, show = true, disabled = false, progress = false, color, textColor } = opts;

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;

    if (!show) {
      tg.MainButton.hide();
      return;
    }

    const wrapped = () => handlerRef.current();
    tg.MainButton.setParams({
      text,
      is_visible: true,
      is_active: !disabled,
      ...(color ? { color } : {}),
      ...(textColor ? { text_color: textColor } : {}),
    });
    if (progress) tg.MainButton.showProgress(true); else tg.MainButton.hideProgress();
    tg.MainButton.onClick(wrapped);

    return () => {
      try { tg.MainButton.offClick(wrapped); } catch {}
      try { tg.MainButton.hideProgress(); } catch {}
      tg.MainButton.hide();
    };
  }, [text, show, disabled, progress, color, textColor]);
}

// ── BackButton hook ─────────────────────────────────────────────────────────

export function useTelegramBackButton(onBack: () => void, show = true): void {
  const handlerRef = useRef<() => void>(() => {});
  handlerRef.current = onBack;

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;

    if (!show) { tg.BackButton.hide(); return; }

    const wrapped = () => handlerRef.current();
    tg.BackButton.onClick(wrapped);
    tg.BackButton.show();

    return () => {
      try { tg.BackButton.offClick(wrapped); } catch {}
      tg.BackButton.hide();
    };
  }, [show]);
}

// ── Haptic helper ───────────────────────────────────────────────────────────

export type HapticEvent =
  | { kind: 'impact'; style: HapticImpactStyle }
  | { kind: 'notify'; type: HapticNotificationType }
  | { kind: 'select' };

export function haptic(event: HapticEvent): void {
  const tg = getTg();
  if (!tg) return;
  try {
    if (event.kind === 'impact') tg.HapticFeedback.impactOccurred(event.style);
    else if (event.kind === 'notify') tg.HapticFeedback.notificationOccurred(event.type);
    else tg.HapticFeedback.selectionChanged();
  } catch {}
}

// Convenience aliases
export const hapticTap     = () => haptic({ kind: 'impact', style: 'light' });
export const hapticBump    = () => haptic({ kind: 'impact', style: 'medium' });
export const hapticThud    = () => haptic({ kind: 'impact', style: 'heavy' });
export const hapticSuccess = () => haptic({ kind: 'notify', type: 'success' });
export const hapticWarn    = () => haptic({ kind: 'notify', type: 'warning' });
export const hapticError   = () => haptic({ kind: 'notify', type: 'error' });
export const hapticSelect  = () => haptic({ kind: 'select' });

// ── Theme sync ──────────────────────────────────────────────────────────────

// Copies Telegram's themeParams (which can be `bg_color`, `text_color`,
// `button_color`, etc.) onto :root as CSS variables prefixed `--tg-`. Use them
// in Tailwind arbitrary-value classes like `bg-[var(--tg-bg-color)]` when you
// want Telegram-native coloring on a given surface.
export function useTelegramThemeSync(): void {
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const apply = () => {
      const root = document.documentElement;
      Object.entries(tg.themeParams ?? {}).forEach(([k, v]) => {
        root.style.setProperty(`--tg-${k.replaceAll('_', '-')}`, String(v));
      });
      root.setAttribute('data-tg-color-scheme', tg.colorScheme ?? 'dark');
    };
    apply();
    // The SDK doesn't expose theme-change events on every version. Re-apply
    // on visibility change as a cheap catch-all.
    const onVis = () => apply();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
}

// ── Tiny client-side helpers ────────────────────────────────────────────────

export function expandWebApp() {
  try { getTg()?.expand(); } catch {}
}

// Opens `url` in the EXTERNAL system browser when inside Telegram, falling
// back to a normal new-tab open elsewhere. Use this for any Google OAuth
// redirect — Telegram's mobile in-app webview is rejected by Google with
// `disallowed_useragent`, the system browser is not.
export function openExternal(url: string): void {
  const tg = getTg();
  if (tg && typeof tg.openLink === 'function') {
    try { tg.openLink(url); return; } catch { /* fall through */ }
  }
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
}
