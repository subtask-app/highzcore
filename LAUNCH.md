# Launching Highzcore

The end-to-end deployment runbook for the Highzcore creator-growth platform.
Follow it top-to-bottom the first time. After launch, the post-launch
section covers ongoing operations (cron schedule, payments, monitoring).

If anything in this file contradicts what you actually find in the codebase,
the codebase wins and this file needs an update.

---

## 0. Prerequisites

You'll need accounts and API keys for:

- [Supabase](https://supabase.com) — Postgres + auth + storage. Free tier works for launch.
- [Netlify](https://netlify.com) — hosting. Free tier works.
- [Telegram BotFather](https://t.me/BotFather) — to create a bot and get a token.
- A Telegram channel (for community announcements) and an admin group (for live support).
- [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) — for channel + video lookups.
- [Google OAuth 2.0 client](https://console.cloud.google.com/apis/credentials) — for "Continue with Google" sign-in.
- [Flutterwave](https://flutterwave.com) — card payments. (Optional at first launch; payments milestone wires it in.)
- [CCPayment](https://ccpayment.com) — USDT TRC20 payouts.
- A custom domain (we use `highzcore.tech`).

---

## 1. One-time Supabase setup

### 1.1 Create the project

1. New Supabase project. Pick a region near your worker majority (e.g.
   `eu-central-1` if Africa/Europe heavy, `ap-southeast-1` for SEA).
2. Note the project URL, anon key, and service-role key.

### 1.2 Apply the schema

1. Open the Supabase SQL editor.
2. Paste the contents of [`schema.sql`](./schema.sql) and run it.
   The script is idempotent + destructive at the top — it WIPES every table
   it owns. First run is fine; later runs are pre-launch resets only.
3. Confirm the tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;
   ```
   Should show 18 tables: `users`, `creator_profiles`, `worker_profiles`,
   `worker_audiences`, `projects`, `insights_studies`, `abtest_tests`,
   `promote_campaigns`, `collab_matches`, `boost_orders`, `tasks`,
   `task_disputes`, `payment_intents`, `withdrawals`, `ledger_entries`,
   `notifications`, `support_messages`, `audit_log`.
4. Confirm the storage buckets exist:
   ```sql
   SELECT id, public FROM storage.buckets;
   ```
   Should show `abtest-thumbnails` (public), `audience-evidence` (private),
   `project-uploads` (public).

### 1.3 Configure auth

1. Authentication → URL Configuration:
   - Site URL: `https://highzcore.tech`
   - Redirect URLs: add `https://highzcore.tech/auth/callback`,
     `https://highzcore.tech/auth/reset-password`, and (during local
     dev) `http://localhost:3000/auth/callback`.
2. Authentication → Providers → Google: enable, paste the OAuth client id +
   secret from your Google Cloud Console. The redirect URI Supabase shows
   should be pasted into Google's "Authorized redirect URIs".
3. Authentication → Email Templates: customise the confirm/reset templates
   to match Highzcore brand voice (per BRAND.md).

### 1.4 Schedule the cron jobs

Open SQL editor and run (replace `<CRON_SECRET>` with the value you'll set
in Netlify):

```sql
-- Notification drain every 30 seconds.
SELECT cron.schedule(
  'process-notifications',
  '*/30 * * * * *',
  $$
  SELECT net.http_get(
    url := 'https://highzcore.tech/api/cron/process-notifications',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  )
  $$
);

-- Expire stale task claims every 5 minutes.
SELECT cron.schedule(
  'expire-stale-claims',
  '*/5 * * * *',
  $$ SELECT expire_stale_claims() $$
);
```

Confirm: `SELECT * FROM cron.job;`.

---

## 2. Telegram bot setup

### 2.1 Create the bot

1. Talk to `@BotFather`. `/newbot`. Pick a name + username (e.g.
   `@HighzcoreOfficial_bot`).
2. Note the bot token.
3. `/setdomain` and link to `highzcore.tech` (required for the mini-app).
4. `/setmenubutton` → Configure → web app URL `https://highzcore.tech` and
   button text "Open Highzcore".

### 2.2 Create the admin group + channel

1. Telegram → New Group. Add the bot. Promote the bot to admin. Use the
   `/id` command in the group to grab the chat id (it'll be a negative
   number). This is `TELEGRAM_ADMIN_CHAT_ID`.
2. Telegram → New Channel. Add the bot as admin. Note the username. This
   is `TELEGRAM_CHANNEL_USERNAME` (without the `@`).

### 2.3 Set the webhook

After deploy is live (section 4), one-time set:

```bash
curl -F "url=https://highzcore.tech/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
```

Verify with:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Should show your domain and zero `pending_update_count` after a few seconds.

---

## 3. Environment variables

These go into Netlify → Site settings → Environment variables. Production +
deploy previews. Required unless flagged optional.

| Var | What | Required |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://highzcore.tech` | ✓ |
| `NEXT_PUBLIC_SITE_NAME` | `Highzcore` | ✓ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (never expose client-side) | ✓ |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | ✓ |
| `TELEGRAM_BOT_TOKEN` | From BotFather | ✓ |
| `TELEGRAM_BOT_USERNAME` | `HighzcoreOfficial_bot` (no @) | ✓ |
| `TELEGRAM_WEBHOOK_SECRET` | Any random ≥32-char string | ✓ |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin group chat id (negative number) | ✓ |
| `TELEGRAM_CHANNEL_USERNAME` | Community channel username (no @) | ✓ |
| `TELEGRAM_CHANNEL_CHAT_ID` | Channel chat id (alternative to username) | optional |
| `CRON_SECRET` | Any random ≥32-char string; matches Bearer in pg_cron job | ✓ |
| `FLUTTERWAVE_PUBLIC_KEY` | For card payments | when payments milestone wires Flutterwave |
| `FLUTTERWAVE_SECRET_KEY` | "" | "" |
| `CCPAYMENT_APP_ID` | For USDT payments | when payments milestone wires CCPayment |
| `CCPAYMENT_APP_SECRET` | "" | "" |

For local dev, copy these into `.env.local`.

---

## 4. Deploy to Netlify

1. Connect the GitHub repo `subtask-app/highzcore` to Netlify.
2. Build command: `npm run build`. Publish directory: `.next`.
3. Install the official Next.js Netlify plugin (`@netlify/plugin-nextjs`)
   — it's listed in [`netlify.toml`](./netlify.toml).
4. Set all the env vars from section 3.
5. Trigger a deploy. First build takes ~2–3 minutes.
6. Once deployed, point your custom domain at the Netlify site (CNAME or
   ALIAS to the Netlify subdomain). Wait for SSL.

---

## 5. Promote yourself to admin

After signing up fresh on the live site:

1. Open the Supabase SQL editor.
2. Paste [`seed.sql`](./seed.sql).
3. Find your row in the STEP 1 output.
4. Uncomment the appropriate STEP 2 line (by email, telegram username, or id)
   and run it.
5. Confirm with STEP 3 that `is_admin = true`.

---

## 6. Smoke tests

Walk every product end-to-end as a final sanity check.

### 6.1 Auth

- [ ] Sign up as a creator (email + password). Confirm email link works.
- [ ] Onboarding wizard completes; lands on `/creator`.
- [ ] Sign out → log in → returns to `/creator`.
- [ ] Sign up as a worker (separate account). Worker dashboard loads.
- [ ] Inside Telegram: tap the mini-app button — `/api/telegram/link` mints
      a session and routes to the right dashboard.

### 6.2 Audience Insights

- [ ] Create a study via `/creator/projects/new/insights`. Pick "Test mode"
      payment so it auto-captures.
- [ ] Project shows on `/creator/projects` with status Live and 0/50 progress.
- [ ] As the worker, claim one task from `/worker/tasks`.
- [ ] Complete the study (watch the video, answer questions, submit).
- [ ] Back as admin: open `/admin/projects?status=submitted` and approve.
- [ ] Worker's earnings move from Pending to Available.
- [ ] Telegram message arrives ("Task approved — $X").

### 6.3 ABTest, Promote, Collab

- [ ] Run the same end-to-end on `/creator/projects/new/abtest` (upload 2
      thumbnails, vote, approve).
- [ ] Run the same on `/creator/projects/new/promote` (worker needs a
      verified audience first — verify via `/admin/workers?tab=audiences`).
- [ ] Run a collab proposal between two creator accounts.

### 6.4 Payouts

- [ ] Worker requests a withdrawal from `/worker/earnings/withdraw`.
- [ ] Admin marks processing + finalizes with a fake tx hash on
      `/admin/finance`.
- [ ] Worker gets the `withdrawal.completed` Telegram message.

### 6.5 Bot

- [ ] DM the bot from a non-admin account. Message forwards into the admin
      group.
- [ ] Reply to the forward in the admin group. Reply relays to the user DM.

---

## 7. Post-launch operations

### Monitoring

- Supabase logs: catch RPC + RLS errors.
- Netlify logs: catch server-action + route errors.
- Telegram: bot will surface its own send failures to the admin group.
- `audit_log` table: review weekly for unexpected admin actions.

### Backups

- Supabase auto-snapshots once a day (free tier). For paid plans, weekly
  PITR snapshots are recommended.

### Cron health

`SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;` —
catch failures fast.

### Withdrawals

CCPayment integration: for now, admins manually push withdrawals from
`/admin/finance` once the payment milestone wires the API.

---

## 8. Common issues

**"Bot not configured"** when hitting `/api/telegram/link` → `TELEGRAM_BOT_TOKEN` missing in Netlify.

**Webhook returns 401** → `TELEGRAM_WEBHOOK_SECRET` mismatch. Re-run section 2.3.

**"Channel not configured"** on `channel.*` notifications → `TELEGRAM_CHANNEL_USERNAME` missing OR the bot isn't an admin in the channel.

**No tasks visible to workers** → check `RLS` policies are enabled
(`schema.sql` does this at the bottom; run section 1.2 again to re-apply).

**Cron drain returns `unauthorized`** → `CRON_SECRET` env var mismatch between Netlify and the `cron.schedule` call.

---

## 9. Pre-launch checklist

Before public launch:

- [ ] All env vars set on Netlify (section 3)
- [ ] Schema applied (section 1.2)
- [ ] Cron scheduled (section 1.4)
- [ ] Bot webhook set (section 2.3)
- [ ] Smoke tests all pass (section 6)
- [ ] At least one admin promoted (section 5)
- [ ] 10–20 pilot creators recruited (free first project credit in exchange
      for testimonials)
- [ ] 100–200 founding workers recruited (Telegram channels, gig
      communities in target countries)
- [ ] Custom domain SSL valid
- [ ] BotFather menu button shows "Open Highzcore"

Once those tick — open the doors.
