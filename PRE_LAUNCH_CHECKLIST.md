# Highzcore — Pre-Launch Runbook

The end-to-end checklist for taking Highzcore from "works on ngrok" to "live for real users." Run through every section in order before you flip the bot to a production webhook.

---

## 0. Pre-flight

- [ ] All seven migrations applied in Supabase (`schema.sql`, then `migrations/0001_…` through `migrations/0007_…`)
- [ ] At least one `users.role = 'admin'` exists (see [seed.sql](seed.sql))
- [ ] `npx tsc --noEmit` returns no errors
- [ ] `.env.local` mirrors `.env.local.example`

---

## 1. Choose your deploy target

This guide assumes **Netlify**. The repo includes [netlify.toml](netlify.toml) with Node 20, function timeouts, and security headers pre-configured. Netlify auto-detects Next.js and installs `@netlify/plugin-nextjs` for you.

Vercel, Railway, Render, Fly, or self-host all work too — anywhere you can serve HTTPS + Node runtime. Substitute platform-specific bits where needed.

---

## 2. Push to GitHub

1. Create a private GitHub repo.
2. From your project:
   ```powershell
   git init
   git add .
   git commit -m "initial production deploy"
   git branch -M main
   git remote add origin https://github.com/<you>/highzcore.git
   git push -u origin main
   ```

> **Critical: never commit `.env.local`.** Verify it's listed in `.gitignore` (it is).

---

## 3. Connect Netlify

1. https://app.netlify.com → **Add new site** → **Import an existing project** → connect GitHub → pick `subtask-app/highzcore`.
2. Framework: **Next.js** (auto-detected from `netlify.toml`). Don't override the build command or publish dir — the `netlify.toml` already sets them.
3. Skip the env vars dialog for now — easier to paste them all at once in step 4.
4. Click **Deploy site**. The first build may fail because env vars aren't set yet. That's expected.
5. Once Netlify finishes, copy your site URL (e.g. `https://highzcore.netlify.app`). You'll attach the custom `highzcore.tech` domain in step 5.5.

---

## 4. Set production environment variables

In Netlify → your site → **Site configuration** → **Environment variables** → **Add a variable** → **Import from .env**. Paste the block below. Set scope to **All scopes** (so deploy previews also work).

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Google
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
YOUTUBE_API_KEY=<youtube data api key>

# Email (nodemailer over Gmail SMTP)
GMAIL_USER=<your gmail address>
GMAIL_APP_PASSWORD=<16-char app password>
FROM_EMAIL="Highzcore <noreply@yourdomain.com>"

# Cron security (X-Cron-Secret header)
CRON_SECRET=<48+ char random>

# OAuth state HMAC
OAUTH_STATE_SECRET=<48+ char random — different from CRON_SECRET>

# Telegram
TELEGRAM_BOT_TOKEN=<from BotFather>
TELEGRAM_BOT_USERNAME=HighzcoreOfficial_bot
TELEGRAM_WEBHOOK_SECRET=<48+ char random>
TELEGRAM_ADMIN_CHAT_ID=-1001234567890
TELEGRAM_CHANNEL_USERNAME=HighzcoreChannel
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=HighzcoreOfficial_bot

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>

# App
NEXT_PUBLIC_APP_URL=https://highzcore.tech    # ← your custom domain on Netlify
NEXT_PUBLIC_SITE_NAME=Highzcore

# Bank (server-only)
BANK_ACCOUNT_NAME=<account name>
BANK_ACCOUNT_NUMBER=<number>
BANK_NAME=<bank>
BANK_ACCOUNT_TYPE=Savings

# WhatsApp (optional)
WHATSAPP_NUMBER=
```

After saving env vars, **trigger a redeploy** (Netlify → Deploys → **Trigger deploy** → **Deploy site**) so the new values take effect.

---

## 5. Attach your custom domain (highzcore.tech)

1. Netlify → your site → **Domain management** → **Add a domain** → enter `highzcore.tech`.
2. Netlify shows you the DNS records to add. The simplest path:
   - At your DNS registrar, point `highzcore.tech` (and `www.highzcore.tech`) at Netlify's nameservers, OR
   - Add the CNAME/A records Netlify shows you (CNAME apex needs ALIAS/ANAME at most registrars).
3. Wait for DNS to propagate (~minutes to a few hours). Netlify auto-issues a Let's Encrypt cert when it sees the domain resolve.
4. Once green, set the apex `highzcore.tech` as the **Primary domain** (Domain management → Set as primary).
5. Make sure `NEXT_PUBLIC_APP_URL` env var is `https://highzcore.tech` (the apex), not the netlify subdomain — redeploy if you change it.

## 6. Update Google Cloud OAuth redirect

YouTube grant + sign-in OAuth now needs to know about your real domain:

1. https://console.cloud.google.com → APIs & Services → Credentials → your OAuth 2.0 Client ID.
2. Add to **Authorized JavaScript origins**:
   - `https://highzcore.tech`
3. Add to **Authorized redirect URIs**:
   - `https://highzcore.tech/auth/callback`
   - `https://highzcore.tech/auth/youtube-callback`
4. Save.

In **OAuth consent screen**, confirm publishing status is **In production** (you set this in M-OAuth-troubleshooting earlier). If still "Testing," click **Publish app**.

---

## 7. Update Supabase Auth redirect URLs

Supabase → your project → **Authentication** → **URL Configuration**:

- **Site URL**: `https://highzcore.tech`
- **Redirect URLs**: add `https://highzcore.tech/**` to the allow-list.

Save.

---

## 8. Point the Telegram bot at production

This is the moment your bot stops being a localhost dev tool.

1. Stop your local `ngrok` (so it can't accidentally serve future requests).
2. In any PowerShell:
   ```powershell
   $token  = "<TELEGRAM_BOT_TOKEN>"
   $secret = "<TELEGRAM_WEBHOOK_SECRET>"
   $appUrl = "https://highzcore.tech"

   curl.exe -F "url=$appUrl/api/telegram/webhook" `
            -F "secret_token=$secret" `
            -F "drop_pending_updates=true" `
            "https://api.telegram.org/bot$token/setWebhook"
   ```
   Expect `{"ok":true,"result":true,"description":"Webhook was set"}`.
3. Verify:
   ```powershell
   curl.exe "https://api.telegram.org/bot$token/getWebhookInfo"
   ```
   The `"url"` field should point at `https://highzcore.tech`.
4. In Telegram, talk to **@BotFather** → `/mybots` → pick the bot → **Bot Settings** → **Configure Mini App** → **Edit Mini App URL** → paste `https://highzcore.tech`. Repeat for **Menu Button** → **Edit menu button URL**.

---

## 9. Wire pg_cron for notifications

The drain endpoint that ships emails + Telegram messages needs to be called every minute. Two options:

### Option A — pg_cron inside Supabase (recommended)

1. Supabase → **Database** → **Extensions** → enable `pg_cron` AND `pg_net`.
2. In the SQL editor:
   ```sql
   ALTER DATABASE postgres SET app.cron_secret = '<CRON_SECRET>';
   ALTER DATABASE postgres SET app.app_url     = 'https://highzcore.tech';
   ```
3. **Disconnect and reconnect the SQL editor** (settings only take effect for new sessions).
4. Schedule both jobs (run as a single block):
   ```sql
   SELECT cron.schedule(
     'process-emails', '* * * * *',
     $cron$
       SELECT net.http_post(
         url := current_setting('app.app_url') || '/api/cron/process-emails',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'X-Cron-Secret', current_setting('app.cron_secret')
         )
       );
     $cron$
   );

   SELECT cron.schedule(
     'send-reminders', '* * * * *',
     $cron$
       SELECT net.http_post(
         url := current_setting('app.app_url') || '/api/cron/send-reminders',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'X-Cron-Secret', current_setting('app.cron_secret')
         )
       );
     $cron$
   );
   ```
5. Verify:
   ```sql
   SELECT jobname, schedule, active FROM cron.job;
   ```
   Both rows should show `active = true`. After ~2 minutes:
   ```sql
   SELECT jobname, status, start_time
   FROM cron.job_run_details
   ORDER BY start_time DESC LIMIT 10;
   ```
   `status = 'succeeded'` rows mean Netlify got the POST and returned 200.

### Option B — Netlify Scheduled Functions

Netlify supports scheduled functions on its free tier with a generous monthly execution-time budget — fine for our once-per-minute drain.

For each cron endpoint, add a thin wrapper in `netlify/functions/`. Example for the emails drain:

```ts
// netlify/functions/cron-process-emails.ts
import type { Config } from '@netlify/functions';

export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/process-emails`, {
    method: 'POST',
    headers: { 'X-Cron-Secret': process.env.CRON_SECRET ?? '' },
  });
  return new Response(await res.text(), { status: res.status });
};

export const config: Config = { schedule: '@every 1m' };
```

Mirror for `cron-send-reminders.ts`. Commit + redeploy. Netlify picks up the schedule automatically.

**Recommended choice**: Option A (pg_cron) — keeps cron and DB co-located so a Netlify outage doesn't stop reminders. Option B is the cleaner fit if you'd rather not enable Postgres extensions.

---

## 10. Smoke test the live deployment

Run through this in order. **Note which step fails first** if anything breaks.

### 9a. Marketing pages
- [ ] `https://<your-domain>/` loads, 3D home renders, no console errors
- [ ] `/for-clients` and `/for-workers` load, FAQ accordions expand, CTAs route
- [ ] `/privacy` and `/terms` load with the back arrow working

### 9b. Auth
- [ ] **Google sign-in works as a client** — sign up via `/signup/client` → lands on `/dashboard/client`
- [ ] **Google sign-in works as a worker** — sign up via `/signup/worker` → lands on `/dashboard/worker`
- [ ] **Telegram Mini App auto-login** — open the bot in Telegram → tap "Open Highzcore" → app opens INSIDE Telegram → user is auto-signed-in → lands on dashboard

### 9c. Client flow
- [ ] First-visit welcome modal shows; "Create my first campaign" → opens new-order modal
- [ ] Campaign creation: fill form → submit → auto-jumps to messages tab → pinned "PAYMENT DETAILS" message visible
- [ ] Admin email arrives with invoice (or Telegram if admin has linked TG)
- [ ] Upload payment proof: tap amber strip → choose file → uploads to Cloudinary → image appears in chat → `contracts.payment_proof_url` is set

### 9d. Admin flow
- [ ] Admin sees the new contract in admin dashboard
- [ ] Admin sees "Confirm payment & activate" amber strip in the contract's chat
- [ ] Click activate → contract status flips → broadcast email/Telegram to every worker
- [ ] Unread message badges work in the contract list

### 9e. Worker flow
- [ ] Worker sees the new contract under Available Tasks
- [ ] Tap → 5-phase modal opens
- [ ] First-time worker: pre-grant explainer shows the 4-step Google walkthrough → "Continue to Google" redirects out and back successfully
- [ ] After grant: modal auto-resumes at "Subscribe" phase for the same task
- [ ] Tap "I subscribed — verify my task" after actually subscribing → 2–3s → ✅ "Task approved" + wallet credit
- [ ] Tap without subscribing → ⚠️ warning modal + warning email/Telegram → completion `verification_attempts` increments

### 9f. Withdrawal flow
- [ ] Worker has balance ≥ ₦1,000 → Request Withdrawal → fill bank details → submit
- [ ] Admin sees withdrawal in Withdrawals tab → click "Mark Paid" → worker's wallet debits, transaction row appears, no double-debit on second click

### 9g. Engagement
- [ ] Verify a task → `users.streak_count` becomes 1
- [ ] Share referral link to another Telegram account → that user opens, signs up via `/start ref_<id>` → `referred_by_user_id` is set → when referee verifies their first task, referrer wallet gets +₦50 and a `referral_bonus` transaction appears
- [ ] Leaderboard tab shows verified earners with first names only

### 9h. Live support
- [ ] DM the bot a question → bot replies "Got your message" (only on fresh session)
- [ ] Forwarded into admin group with user info header
- [ ] Admin replies-to in group → user receives the reply as "💬 Highzcore support"

### 9i. Community channel
- [ ] Admin activates a contract → channel gets one "🎯 New task is live" post with deep-link
- [ ] Tap deep-link → mini app opens at `/dashboard/worker?tab=available-tasks`

---

## 11. If something goes wrong

### Netlify build fails
- Look at the deploy log. Most common: missing env var → re-add → trigger redeploy.
- If you see "Cannot find module 'sharp'" → in Netlify env vars add `SHARP_IGNORE_GLOBAL_LIBVIPS=1`.
- If the Next.js plugin isn't auto-installed: Netlify → Site configuration → **Build & deploy** → Plugins → install `@netlify/plugin-nextjs` manually.

### "Webhook was set" but the bot doesn't respond
- Hit `https://api.telegram.org/bot<token>/getWebhookInfo` — look at `last_error_message`. If it's "Bad Request: bot was blocked," the user blocked the bot. If it's "SSL handshake failed," the domain may be wrong. If "401 Unauthorized," your `TELEGRAM_WEBHOOK_SECRET` mismatch.

### Mini app shows "Access blocked"
- Google OAuth still in Testing mode → publish to Production (see step 5).

### Emails stuck in queue
- Check `pending_emails WHERE failed_at IS NOT NULL` — read the `error` column. Most likely Gmail rejected (bad app password) or you hit the daily limit (~500 sends/day on personal Gmail, ~2000 on Workspace).

### Telegram messages stuck in queue
- Same query — error string starts with `telegram:`. Most likely the recipient blocked the bot, or the channel bot lacks Post Messages permission.

---

## 12. Rollback plan

If a deploy breaks the live mini app:

1. Netlify → Deploys → click your previous-working deploy → **Publish deploy**. Takes ~10 seconds.
2. If the migration is the culprit, run any rollback SQL needed in Supabase (none of the migrations have one-line rollback — each is additive; only `migrations/0006_engagement.sql`'s trigger could be `DROP`-ed to disable it).
3. If Telegram is misbehaving, temporarily remove the webhook:
   ```powershell
   curl.exe -F "url=" "https://api.telegram.org/bot<token>/setWebhook"
   ```
   The bot stops responding but doesn't fire bad logic. Re-set the webhook when ready.

---

## 13. Day-of-launch checklist

- [ ] Netlify is serving from the custom apex domain (`https://highzcore.tech`), not the default `*.netlify.app`
- [ ] Privacy / Terms pages have your real business address (currently still placeholder)
- [ ] Cloudinary upload preset `subtask_media` exists and is unsigned-enabled
- [ ] Telegram bot's `/start`, `/help`, `/support`, `/id` commands all work in production
- [ ] At least one admin's Telegram is linked, so admin notifications go through
- [ ] Bank account details in env are the REAL ones, not the placeholder `0123456789`
- [ ] You've sent a test withdrawal end-to-end and the cash actually arrived
- [ ] Backup of the Supabase database scheduled (Supabase Pro plan, or `pg_dump` weekly)
- [ ] Sentry or similar error reporting wired up (optional but recommended)
- [ ] Netlify Analytics enabled (paid add-on, $9/mo) — OR Google Analytics 4 + Search Console set up (both free)
- [ ] Drop a 1200×630 `og-image.png` into `public/` so social-share previews look polished (the metadata already references `/og-image.png`)
- [ ] Add your Google Search Console verification token in `src/app/layout.tsx` → `metadata.verification.google` and redeploy
- [ ] Submit your sitemap at `https://highzcore.tech/sitemap.xml` in Google Search Console

---

## Known limits to revisit post-launch

| Subsystem | Current ceiling | When to fix |
|---|---|---|
| Gmail SMTP | ~500/day personal, ~2000/day Workspace | When daily emails exceed that → switch to Mailgun/SES |
| Telegram per-user DM rate | 30 msg/sec per bot | Should be fine until ~thousands of concurrent verifies |
| pg_cron precision | 1-minute granularity | Probably never an issue |
| Verification attempts | 20 per (worker × contract) before auto-reject | Re-evaluate if support-tickets explode |
| Worker broadcast on contract activation | One DB row per worker per contract (O(N)) | When N > 10k workers, batch into chunks |

---

Ship it.
