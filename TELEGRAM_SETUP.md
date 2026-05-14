# Telegram bot + Mini App setup

The Highzcore app is now distributed as a Telegram Mini App. A single bot
(`@HighzcoreBot` or whatever you name it) handles three roles:

1. **Acquisition** — `/start` opens the mini app via a `web_app` button.
2. **Live support** — users DM the bot, admin sees the thread (wired in M10).
3. **Outbound notifications** — new task broadcasts, task verified, withdrawal
   paid (wired in M9).

This doc covers the **first-time setup** for both production and local dev.

---

## 1. Create the bot

1. Open Telegram, talk to [@BotFather](https://t.me/BotFather).
2. `/newbot` → pick a display name → pick a username ending in `bot`.
3. BotFather replies with a **bot token** — copy it.
4. (Recommended) `/setdescription`, `/setabouttext`, `/setuserpic` to personalize.
5. **Enable Mini App support**: BotFather → `/mybots` → pick your bot →
   *Bot Settings* → *Menu Button* → *Edit menu button URL* →
   set to `https://YOUR_APP_URL` (this is what shows as the side menu inside
   any DM with the bot).
6. *Bot Settings* → *Configure Mini App* → *Edit Mini App URL* →
   same URL. This is what the `/start` command's button launches.

Put the bot token into `.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-xxx
TELEGRAM_BOT_USERNAME=HighzcoreBot
```

Generate a long random `TELEGRAM_WEBHOOK_SECRET` (any 48+ char string).

---

## 2. Local development with ngrok

Telegram's webhook MUST be a public HTTPS URL. For local testing:

```powershell
# Install once
winget install ngrok
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Each session
ngrok http 3000
```

ngrok prints a forwarding URL like `https://abc-123.ngrok-free.app`. That's
your `NEXT_PUBLIC_APP_URL` for the duration of the session.

Run `npm run dev` in another terminal.

---

## 3. Register the webhook

Once for each environment (local with ngrok, staging, prod):

```powershell
# PowerShell
$token  = $env:TELEGRAM_BOT_TOKEN
$secret = $env:TELEGRAM_WEBHOOK_SECRET
$appUrl = $env:NEXT_PUBLIC_APP_URL      # the public URL

curl.exe -F "url=$appUrl/api/telegram/webhook" `
         -F "secret_token=$secret" `
         -F "drop_pending_updates=true" `
         "https://api.telegram.org/bot$token/setWebhook"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

Verify it's live:

```powershell
curl.exe "https://api.telegram.org/bot$token/getWebhookInfo"
```

Look for `"url": "https://.../api/telegram/webhook"` and `"pending_update_count": 0`.

---

## 4. Test it

In Telegram, DM your bot. Send `/start`. You should get a welcome message
with an "🚀 Open Highzcore" button. Tap it — your mini app opens inside
Telegram and auto-signs-you-in via `initData`.

Watch the dev server log — you should see `POST /api/telegram/link 200`.

---

## 5. Remove or replace later

To unset a webhook (e.g. switching environments):

```powershell
curl.exe -F "url=" "https://api.telegram.org/bot$token/setWebhook"
```

---

---

## 6. (M10) Live support — admin group

For the bot to forward user DMs to your team and relay replies back, set up
a private group:

1. **Create a Telegram group** (Telegram → New Group). Name it something
   internal like "Highzcore Support — Admins".
2. **Add your bot** to the group. Type its username, invite.
3. **Promote the bot to admin** so it can read all messages (not just commands
   addressed at it). In the group → group avatar → *Administrators* → *Add Admin*
   → pick your bot → grant at least *Delete Messages* + *Pin Messages* (the
   real reason: promoting a bot disables "Privacy Mode" so it sees everything).
4. **Get the group chat id**. The easiest way: send any message in the group,
   then run:
   ```powershell
   $token = $env:TELEGRAM_BOT_TOKEN
   curl.exe "https://api.telegram.org/bot$token/getUpdates"
   ```
   Find your group's message in the JSON. Look for `"chat":{"id": -1001234567890`.
   Group ids are **negative**. Copy it including the minus sign.
5. **Set the env**:
   ```env
   TELEGRAM_ADMIN_CHAT_ID=-1001234567890
   ```
6. Restart `npm run dev`.

To test: open a private chat with the bot (use a different Telegram account
than your admin one), send any text. The bot should reply "Got your message"
and the admin group should receive a forwarded copy with the user's name and
id. **Reply to that forwarded message** in the group with your answer — the
bot relays it back to the user.

---

## 7. (M10) Community channel

For the bot to post announcements ("🎯 New task is live"):

1. **Create a Telegram channel** (Telegram → New Channel). Public.
2. Pick a username (`@HighzcoreChannel`).
3. **Add the bot as administrator** of the channel with *Post Messages* permission.
4. Set one of these env vars:
   ```env
   # By username — easier:
   TELEGRAM_CHANNEL_USERNAME=HighzcoreChannel
   # OR by numeric chat id (use this if you want a private channel):
   # TELEGRAM_CHANNEL_CHAT_ID=-1009876543210
   ```
5. Restart `npm run dev`.

Now every time an admin activates a contract, on top of per-worker DMs,
the bot posts one message to the channel with an "🚀 Open Highzcore" deep-link.

---

## Common gotchas

- **Webhook 401**: your `TELEGRAM_WEBHOOK_SECRET` env doesn't match the one
  you registered with `setWebhook`. Re-run setWebhook with the right secret.
- **Mini app shows the public site, not the auto-login**: you're not inside
  Telegram — open via the bot's button or the menu button to get initData.
- **`initdata_expired` error**: the initData is older than 1 hour. Close
  and reopen the mini app from Telegram.
- **"hash_mismatch"**: token mismatch. The token you HMAC-verify with must
  match the bot that issued the initData.
- **Mobile vs Desktop Telegram**: the mini app works on both, but on
  desktop the menu-button URL must be HTTPS — http://localhost won't load.
