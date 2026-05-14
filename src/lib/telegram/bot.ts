// The Highzcore Telegram bot.
//
// Single bot, webhook-driven. Four roles:
//   * Acquisition: /start opens the Mini App (with optional referral payload).
//   * Help: /help shows the basics.
//   * Live support (M10): users DM the bot → forwarded into an admin group;
//     admins reply-to those forwards → bot relays back to the user.
//   * Outbound notifications: dispatched by the cron drain (M9).
//
// Parse mode: HTML. MarkdownV2 requires escaping ~14 reserved characters and
// is famously easy to break with a stray `.` or `!`. HTML mode only needs `<`,
// `>`, `&` escaped.

import { Bot, InlineKeyboard, type Context } from 'grammy';
import { serviceClient } from '@/lib/supabase/service';

let cached: Bot | null = null;

export function getBot(): Bot {
  if (cached) return cached;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  const bot = new Bot(token);
  registerCommands(bot);
  cached = bot;
  return bot;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
}

function botUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME ?? 'HighzcoreBot';
}

function adminChatId(): number | null {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function openAppKeyboard(extraPath?: string): InlineKeyboard | undefined {
  // `web_app` buttons are special — Telegram opens the URL as a Mini App
  // INSIDE the chat instead of in the browser, and supplies initData.
  // Telegram REQUIRES https:// for these. If env points at localhost or
  // something insecure, skip the button instead of crashing the whole send.
  const url = extraPath ? `${appUrl()}${extraPath}` : appUrl();
  if (!url.startsWith('https://')) {
    console.warn('telegram bot: skipping web_app button — NEXT_PUBLIC_APP_URL is not https:', url);
    return undefined;
  }
  return new InlineKeyboard().webApp('🚀 Open Highzcore', url);
}

// Escape only the three HTML-meaningful chars in untrusted strings.
function esc(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// ── Live support ───────────────────────────────────────────────────────────

// Returns true when the user hasn't had any support traffic in the last
// SESSION_GAP_MS (in either direction). Used to gate the "got your message"
// auto-ack so it fires once per fresh session, not on every single DM.
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

async function isFreshSupportSession(tgUserId: number): Promise<boolean> {
  try {
    const admin = serviceClient();
    const { data } = await admin
      .from('support_messages')
      .select('created_at')
      .eq('user_telegram_id', tgUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { created_at: string } | null };
    if (!data) return true; // first ever message — definitely ack
    const ageMs = Date.now() - new Date(data.created_at).getTime();
    return ageMs > SESSION_GAP_MS;
  } catch {
    // If we can't query (e.g. migration 0005 not yet applied) default to
    // ack-ing rather than silently swallowing — over-acknowledging is a
    // better failure mode than appearing to ignore the user.
    return true;
  }
}

// Forward a user DM into the admin group. The forwarded message embeds the
// user's Telegram id so admin replies-to can be routed back. We also log to
// the support_messages table for audit.
//
// Every external call is best-effort — DB writes / forwards / lookups can
// fail (missing migration, RLS quirk, etc.) and we DO NOT want any of those
// to block the user-facing acknowledgement reply in the catch-all.
async function forwardUserDmToAdmins(ctx: Context, text: string) {
  const tgUser = ctx.from;
  if (!tgUser) return;
  const groupId = adminChatId();

  // Try to find this user's Highzcore id (might not be linked yet).
  let linkedUserId: string | null = null;
  try {
    const admin = serviceClient();
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle() as { data: { id: string } | null };
    linkedUserId = data?.id ?? null;
  } catch (err) {
    console.error('support: user lookup failed (non-fatal):', err);
  }

  const userMessageId = ctx.message?.message_id ?? null;
  let forwardedId: number | null = null;

  if (groupId) {
    const userLabel = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || `id ${tgUser.id}`;
    const usernamePart = tgUser.username ? ` (@${esc(tgUser.username)})` : '';
    const preview = [
      `💬 <b><a href="tg://user?id=${tgUser.id}">${esc(userLabel)}</a></b>${usernamePart}`,
      `🆔 <code>${tgUser.id}</code>`,
      '',
      esc(text),
    ].join('\n');

    try {
      const forwarded = await ctx.api.sendMessage(groupId, preview, { parse_mode: 'HTML' });
      forwardedId = forwarded.message_id;
    } catch (err) {
      console.error('support: failed to forward to admin group (non-fatal):', err);
    }
  }

  // Best-effort log. If the support_messages table doesn't exist yet (e.g.
  // migration 0005 not applied) this swallows the error so we still ack
  // the user above us.
  try {
    const admin = serviceClient();
    await admin.from('support_messages').insert({
      user_telegram_id: tgUser.id,
      user_id: linkedUserId,
      direction: 'user_to_admin',
      text,
      user_message_id: userMessageId,
      admin_message_id: forwardedId,
    });
  } catch (err) {
    console.error('support: support_messages insert failed (non-fatal):', err);
  }
}

// Admin replied to one of our forwarded messages in the admin group → look up
// the original user_telegram_id and relay the reply back to them.
async function relayAdminReplyToUser(ctx: Context): Promise<boolean> {
  const replyTo = ctx.message?.reply_to_message;
  const text = ctx.message?.text;
  if (!replyTo || !text) return false;

  let thread: { user_telegram_id: number; user_id: string | null } | null = null;
  try {
    const admin = serviceClient();
    const { data } = await admin
      .from('support_messages')
      .select('user_telegram_id, user_id')
      .eq('admin_message_id', replyTo.message_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { user_telegram_id: number; user_id: string | null } | null };
    thread = data;
  } catch (err) {
    console.error('support: thread lookup failed:', err);
    return false;
  }

  if (!thread) return false; // not a reply to one of ours

  try {
    await ctx.api.sendMessage(
      thread.user_telegram_id,
      `💬 <b>Highzcore support</b>\n\n${esc(text)}`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    console.error('support: failed to send admin reply to user:', err);
    return false;
  }

  // Best-effort log.
  try {
    const admin = serviceClient();
    await admin.from('support_messages').insert({
      user_telegram_id: thread.user_telegram_id,
      user_id: thread.user_id,
      direction: 'admin_to_user',
      text,
      user_message_id: null,
      admin_message_id: ctx.message?.message_id ?? null,
    });
  } catch (err) {
    console.error('support: admin_to_user log failed (non-fatal):', err);
  }
  return true;
}

// ── Commands & handlers ────────────────────────────────────────────────────

function registerCommands(bot: Bot) {
  // /start [optional payload]
  bot.command('start', async (ctx) => {
    const payload = ctx.match?.trim();      // e.g. "ref_<userId>" for referrals
    const tgUser = ctx.from;
    const first = esc(tgUser?.first_name ?? 'there');

    // Stash the referral payload as a deep-link param the mini app can read.
    const kb = openAppKeyboard(payload ? `/?start=${encodeURIComponent(payload)}` : undefined);

    await ctx.reply(
      [
        `👋 Hi ${first}! Welcome to <b>Highzcore</b> — real YouTube subscribers, real workers, real money.`,
        '',
        '<b>Creators</b>: grow your channel with real subs verified by YouTube.',
        '<b>Workers</b>: earn for every subscription you verify.',
        '',
        'Tap below to open the app and pick your side.',
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: kb },
    );
  });

  bot.command('help', async (ctx) => {
    const kb = new InlineKeyboard()
      .webApp('Open the app', appUrl())
      .row()
      .url('Need a human?', `https://t.me/${botUsername()}?start=support`);
    await ctx.reply(
      [
        '<b>Highzcore quick guide</b>',
        '',
        '/start — open the app',
        '/support — talk to our team',
        '/help — this message',
        '',
        'Most actions (create campaign, claim task, withdraw) live inside the mini app.',
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: kb },
    );
  });

  // Debug helper: print this chat's id. Useful during setup to grab
  // the admin-group / channel chat id without disabling the webhook.
  bot.command('id', async (ctx) => {
    const chatId = ctx.chat?.id;
    const chatType = ctx.chat?.type;
    const title = (ctx.chat && 'title' in ctx.chat) ? ctx.chat.title : undefined;
    await ctx.reply(
      [
        '🆔 <b>Chat id</b>',
        '',
        `<code>${chatId}</code>`,
        '',
        `Type: ${chatType ?? '?'}${title ? ` — ${esc(String(title))}` : ''}`,
        '',
        chatType === 'group' || chatType === 'supergroup'
          ? 'Paste this (including the minus sign) into <code>TELEGRAM_ADMIN_CHAT_ID</code> in your .env.local, then restart the dev server.'
          : '',
      ].filter(Boolean).join('\n'),
      { parse_mode: 'HTML' },
    );
  });

  bot.command('support', async (ctx) => {
    await ctx.reply(
      [
        '💬 <b>You\'re in the right place.</b>',
        '',
        'Type your question below and a human from our team will get back to you here. ' +
        'We usually reply in a few minutes during the day.',
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: openAppKeyboard() },
    );
  });

  // Generic message handler.
  // Three paths, picked by context:
  //   1. Admin group + reply to a previously-forwarded user message → relay back to user
  //   2. Private DM with non-command text → log + forward to admin group, acknowledge
  //   3. Anything else → friendly nudge to the mini app
  bot.on('message', async (ctx) => {
    const text = ctx.message?.text;
    if (!text || text.startsWith('/')) return; // commands handled above

    const chatType = ctx.chat?.type;
    const groupId = adminChatId();

    // (1) Admin reply inside the admin group
    if (groupId && (chatType === 'group' || chatType === 'supergroup') && ctx.chat?.id === groupId) {
      const handled = await relayAdminReplyToUser(ctx);
      if (handled) {
        // Light acknowledgement so admins see their reply went out.
        try { await ctx.react('👍' as any); } catch {}
      }
      return;
    }

    // (2) User DM → forward to admin group
    if (chatType === 'private') {
      // Decide BEFORE we write the new row whether this counts as a fresh
      // session. After the forward inserts a new support_messages row,
      // the latest-row timestamp will always be ~now.
      const fresh = ctx.from?.id ? await isFreshSupportSession(ctx.from.id) : true;
      await forwardUserDmToAdmins(ctx, text);
      if (fresh) {
        await ctx.reply(
          [
            '✅ <b>Got your message</b>',
            '',
            'A human from our team will reply here. While you wait, the mini app has most of what you need.',
          ].join('\n'),
          { parse_mode: 'HTML', reply_markup: openAppKeyboard() },
        );
      }
      // Subsequent messages inside the same session: forwarded silently.
      // Admin will respond when they can. No "Got your message" repeats.
      return;
    }

    // (3) Catch-all (e.g. message in a different group): friendly nudge.
    await ctx.reply(
      'Open the Highzcore mini app to manage your account.',
      { reply_markup: openAppKeyboard() },
    );
  });
}
