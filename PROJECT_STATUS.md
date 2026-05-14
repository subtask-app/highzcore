# Highzcore — Project Status

**Last updated:** 2026-05-12 · End of M14 (pre-launch hardening)

A two-sided marketplace connecting YouTube creators with workers who help them reach the 1,000-subscriber monetization threshold. Distributed primarily as a **Telegram Mini App** with a single `@HighzcoreOfficial_bot` handling acquisition, notifications, live support, and a community channel. Web is the fallback surface.

**Status:** all 14 planned milestones complete. Code is launch-ready. Operational work (Vercel deploy, Telegram production webhook, pg_cron setup) is documented in [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md).

---

## Stack

- **Frontend**: Next.js 16.2 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind v4
- **3D home page**: three.js · @react-three/fiber · @react-three/drei
- **Database / Auth**: Supabase (Postgres 15 + Auth + Realtime + Storage)
- **Email transport**: nodemailer over Gmail SMTP (free, ~500/day on personal Gmail)
- **Telegram**: grammy bot framework (webhook-based)
- **Media uploads**: Cloudinary
- **Hosting target**: Vercel
- **Cron**: pg_cron + pg_net (Supabase) calling Next.js drain endpoints

---

## Milestone summary

| # | Milestone | Status | Highlights |
|---|---|---|---|
| M0 | Foundation | ✅ | One authoritative `schema.sql` + atomic RPCs (`verify_completion`, `reject_completion`, `mark_withdrawal_paid`), proper RLS via `is_admin()`, realtime enabled, `middleware → proxy` rename, `database.types.ts` regenerated, centralized constants |
| M1 | Email infrastructure | ✅ | `pending_emails` queue + 6 triggers + 8 HTML email templates + `/api/cron/process-emails` + `/api/cron/send-reminders` (2-min admin, 10-min client) |
| M2 | Auth refactor | ✅ | Stripped YouTube scope from primary login, HMAC-signed OAuth `state`, dedicated grant flow in worker dashboard |
| M3 | 3D home page | ✅ | CSS preloader, scroll-driven 3D scene with 5 camera waypoints, instanced workers, reduced-motion fallback |
| M4 | Marketing pages | ✅ | Canonical `<Logo>` + `<Navbar>` + brand primitives (`Eyebrow`, `SectionHeading`, `Card`); `/for-clients` and `/for-workers` rewritten with seeded testimonials + FAQ accordions |
| M5 | Client dashboard flow | ✅ | First-time welcome modal, empty-state 4-step guide, auto-pinned bank-detail message on contract creation, payment-proof upload via Cloudinary |
| M6 | Worker task flow | ✅ | 5-phase TaskFlowModal (brief → grant explainer → subscribe → verify → result), self-verify RPC, soft warning + email on failed verify, slots-remaining bar on cards, auto-resume after Google grant |
| M7 | Admin dashboard polish | ✅ | Atomic withdrawal payout via `mark_withdrawal_paid`, atomic reject via `reject_completion`, payment-proof preview + Activate strip, unread message badges with priority sort |
| M8 | Telegram foundation | ✅ | grammy bot with `/start`, `/help`, `/support`, `/id`; webhook + initData verifier; auto-link mini-app users to Supabase via magic-link tokens |
| M9 | Telegram notifications | ✅ | `pending_emails.channel` column ('email'\|'telegram'\|'telegram_channel'); `pick_channel(user_id)` SQL helper; 9 Telegram templates with deep-link `web_app` buttons |
| M10 | Community + live support | ✅ | `support_messages` table + bot forwards user DMs to admin group → admin replies-to → bot relays back. Community channel announcements on contract activation. |
| M11 | Mini app native UX | ✅ | Typed `useTelegramMainButton` / `useTelegramBackButton` / `haptic*` hooks; theme sync; hides marketing navbar inside Telegram; MainButton + BackButton wired into every modal |
| M12 | Engagement | ✅ | Referrals via `?start=ref_<id>` with auto-bonus on first verified task; streak counter via verify trigger; leaderboard RPC + tab (today/week/month/all-time) |
| M13 | Senior design pass | ✅ | Dead-code purge (6 unused 3D components); dashboards unified to brand cyan→blue gradient; canonical `<Button>` primitive; mobile tap-targets ≥ 40px; iOS-zoom prevention on inputs |
| M14 | Pre-launch hardening | ✅ | Rate limit on `/api/verify-subscription` (15s cooldown + 20-attempt cap, auto-reject); URL-protocol CHECK constraints; comprehensive deploy runbook |

---

## What's in the box

### Database (7 migrations)

```
schema.sql                                  — baseline schema, RLS, RPCs
migrations/0001_email_queue.sql             — notification queue + triggers
migrations/0002_worker_task_flow.sql        — self_verify_completion RPC + retry counter
migrations/0003_telegram_foundation.sql     — telegram_user_id + linked_at on users
migrations/0004_notification_channels.sql   — channel column + pick_channel() helper
migrations/0005_support_and_community.sql   — support_messages table + community channel
migrations/0006_engagement.sql              — referrals + streaks + leaderboard
migrations/0007_security_hardening.sql      — URL protocol CHECK constraints
```

### App routes

```
src/app/
├── page.tsx                                — 3D scroll-driven home (M3)
├── for-clients/                            — marketing (M4)
├── for-workers/                            — marketing (M4)
├── privacy/, terms/                        — legal
├── login/, signup/                         — Google OAuth flows
├── dashboard/
│   ├── client/                             — campaigns, messages, payment proof
│   ├── worker/                             — tasks, withdrawals, leaderboard, referrals
│   └── admin/                              — contracts, withdrawals, support, users
├── auth/
│   ├── callback/                           — Google sign-in OAuth callback
│   └── youtube-callback/                   — YouTube grant OAuth callback (HMAC-signed state)
└── api/
    ├── contracts/[id]/pin-instructions/    — auto-pin bank details after create
    ├── contracts/[id]/payment-proof/       — Cloudinary URL → contract row + chat message
    ├── verify-subscription/                — worker self-verify w/ rate limit
    ├── request-youtube-access/             — issues Google OAuth URL
    ├── leaderboard/                        — top earners
    ├── telegram/
    │   ├── webhook/                        — grammy callback
    │   └── link/                           — mini-app initData → Supabase session
    └── cron/
        ├── process-emails/                 — drains pending_emails (email + telegram)
        └── send-reminders/                 — 2-min admin / 10-min client reminders
```

### Library

```
src/lib/
├── constants.ts                            — pricing, payout, min withdrawal, referral bonus
├── utils.ts                                — cn, formatCurrency, formatNumber
├── supabase/
│   ├── client.ts                           — browser client
│   ├── server.ts                           — SSR client (sets cookies)
│   ├── middleware.ts                       — updateSession helper
│   └── service.ts                          — service-role client (bypasses RLS)
├── email/
│   ├── types.ts                            — typed payloads + AnyTelegramType
│   ├── render.ts                           — HTML email template registry
│   ├── sender.ts                           — nodemailer wrapper
│   └── templates/                          — 8 transactional email templates
├── telegram/
│   ├── bot.ts                              — grammy bot + commands + live-support routing
│   ├── verify.ts                           — initData HMAC verifier
│   ├── webapp.ts                           — typed WebApp accessor + hooks
│   ├── render.ts                           — Telegram template registry
│   ├── send.ts                             — sendTelegramNotification + sendTelegramChannelBroadcast
│   └── templates/                          — 9 Telegram templates (mirror email + community_announcement)
└── youtube/
    ├── checkSubscription.ts                — YouTube Data API helpers
    └── verifySubscription.ts               — client-side wrapper
```

### Components

```
src/components/
├── brand/                                  — Logo, Navbar, Button, primitives (M4 / M13)
├── home/                                   — preloader, scenes, scroll hook, theme bridge
├── telegram/                               — TelegramAutoLink, TelegramBack, TelegramBridge
├── worker/                                 — TaskFlowModal, GoogleGrantExplainer
└── youtube/                                — GrantYouTubeAccess (compact + full)
```

---

## Critical operational notes

- **Bot token, webhook secret, OAuth state secret, cron secret are all different values** and must be rotated independently. Don't reuse.
- **OAuth consent screen must be in "Production" mode** (not "Testing") — otherwise the 100-user cap blocks anyone past your test list. The "Google hasn't verified this app" warning that users see is normal; the mini app's pre-grant explainer walks them through bypassing it via "Advanced → Continue."
- **Gmail SMTP has a daily send cap** (~500/day personal, ~2000/day Workspace). When you exceed it, swap nodemailer for SES/Mailgun. Code stays the same; only `src/lib/email/sender.ts` changes.
- **pg_cron is the cron-of-record.** Vercel Cron would work too but the free tier caps at 100 invocations/day, which doesn't cover a per-minute drain.
- **The `Logo3D / Scene3D / Text3DLogo / FlyingPlaneLogo / HeroIllustration / FloatingCards` components were removed in M13** because they were orphaned after M3. The actual 3D home page lives in `src/components/home/`.

---

## What I deliberately did NOT build

- **Automated test suite.** Manual smoke test plan in [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) §9 covers happy paths. Wire Playwright / Vitest post-launch when there's a stable surface to test against.
- **Multi-currency support.** Pricing is still in ₦. Hardcoded across constants + templates. Marketing copy is already country-agnostic; the actual currency swap is one constant + one migration to a per-user `currency` field. Defer until you have demand outside Nigeria.
- **Admin support inbox view inside the dashboard.** Live support runs via Telegram only — admins use Telegram's native group chat to triage. If admin volume grows, M10's `support_messages` table is already populated and a UI can be added without schema changes.
- **Worker dashboard chat with admin.** Per-contract chat is client↔admin only. Workers reach support exclusively through the bot DM.

---

## Numbers from the audit

- **Files**: ~85 source files (TypeScript + SQL + docs)
- **Lines of TypeScript**: ~10,000
- **Lines of SQL**: ~900 across schema + 7 migrations
- **API routes**: 11
- **Email + Telegram templates**: 17 (8 email + 9 Telegram)
- **Typecheck**: clean (`npx tsc --noEmit` returns nothing)
- **Lighthouse on /**: not yet measured; expect ~85+ once deployed (3D home is the variable)

---

## Next move

Follow [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md). The technical work is done.
