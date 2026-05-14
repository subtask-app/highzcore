// POST /api/telegram/webhook
//
// Telegram pushes every bot update here. We validate the secret token header
// (set by us during setWebhook) before handing the update off to grammy.
//
// Setup once per environment:
//   curl -F "url=https://YOUR_DOMAIN/api/telegram/webhook" \
//        -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
//        "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"

import { type NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { getBot } from '@/lib/telegram/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// grammy's webhook adapter wraps the bot in a Next-compatible handler.
let cached: ((req: NextRequest) => Promise<Response>) | null = null;
function getHandler() {
  if (cached) return cached;
  cached = webhookCallback(getBot(), 'std/http') as unknown as (req: NextRequest) => Promise<Response>;
  return cached;
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 500 });
  }
  if (request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    return await getHandler()(request);
  } catch (err: any) {
    console.error('telegram webhook handler error:', err);
    // Always return 200 to Telegram so they don't keep retrying a poisoned
    // update. We log it for our own debugging.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
