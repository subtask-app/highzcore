'use client';

// Drop this on any page that should show Telegram's native back-arrow
// (top-left of the WebApp chrome). When the user taps it, we route to
// `href` (default: home).
//
// Renders nothing visible — pairs with whatever in-page nav the page already
// has for web users. No-op outside Telegram.

import { useRouter } from 'next/navigation';
import { hapticTap, useTelegramBackButton } from '@/lib/telegram/webapp';

interface Props {
  href?: string;
}

export default function TelegramBack({ href = '/' }: Props) {
  const router = useRouter();
  useTelegramBackButton(() => {
    hapticTap();
    router.push(href);
  });
  return null;
}
