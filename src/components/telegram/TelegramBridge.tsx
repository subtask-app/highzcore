'use client';

// Mounts Telegram WebApp-level effects that should run on every page once the
// app is open inside Telegram:
//   * tg.ready() + tg.expand() so we get full viewport
//   * theme sync (copies themeParams onto :root CSS vars)
//   * marks <html> with `data-in-telegram` so CSS can adapt
//
// Cheap, no rendering. Mounted alongside <TelegramAutoLink/> in root layout.

import { useEffect } from 'react';
import { expandWebApp, getTg, useTelegramThemeSync } from '@/lib/telegram/webapp';

export default function TelegramBridge() {
  useTelegramThemeSync();

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    try { tg.ready(); } catch {}
    expandWebApp();
    document.documentElement.setAttribute('data-in-telegram', '1');
    return () => document.documentElement.removeAttribute('data-in-telegram');
  }, []);

  return null;
}
