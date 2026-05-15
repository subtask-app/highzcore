-- =============================================================================
-- Highzcore — Authoritative Schema (M1 — Creator Growth Platform rebuild)
-- =============================================================================
-- THIS file is the single source of truth for the database. Everything in
-- legacy_sql/ is historical and must not be applied.
--
-- Model overview:
--
--   users                          ── one account per person (Auth-mirrored)
--     ├── creator_profiles         ── extra fields if is_creator
--     └── worker_profiles          ── extra fields if is_worker
--          └── worker_audiences    ── linked external accounts (Promote)
--
--   projects                       ── master polymorphic table for ALL creator
--     │                               requests across 5 products
--     ├── insights_studies         ── product-specific detail (one of these)
--     ├── abtest_tests
--     ├── promote_campaigns
--     ├── collab_matches
--     └── boost_orders
--          │
--          └── tasks               ── work units workers claim + complete
--                └── task_disputes
--
--   payment_intents                ── creator-side payments in (per project)
--   withdrawals                    ── worker-side payments out (USDT TRC20)
--   ledger_entries                 ── audit trail for every worker balance change
--   notifications                  ── in-app + email + telegram queue
--   support_messages               ── live-support thread storage
--   audit_log                      ── admin/security audit
--
-- Money rules:
--   - ALL amounts are USD, stored as NUMERIC(14, 4) (4 decimals — supports
--     payouts as small as $0.0001 per task without rounding drift).
--   - Worker balances are NEVER touched directly from app code. Use the
--     RPCs at the bottom of this file. Direct UPDATEs will eventually
--     diverge from the ledger.
--
-- To apply: paste into Supabase SQL Editor and run. The file is
-- idempotent (destructive at the top) — running it WIPES every table it
-- owns and rebuilds them. Pre-launch we wipe + reapply freely; post-launch
-- changes go through numbered migrations.
-- =============================================================================


-- =============================================================================
-- 0. Reset — drop everything we own, in reverse-dependency order
-- =============================================================================

DROP FUNCTION IF EXISTS request_withdrawal(uuid, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS finalize_withdrawal(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS fail_withdrawal(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS claim_task(uuid) CASCADE;
DROP FUNCTION IF EXISTS submit_task(uuid, jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS approve_task(uuid) CASCADE;
DROP FUNCTION IF EXISTS reject_task(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS expire_stale_claims() CASCADE;
DROP FUNCTION IF EXISTS capture_project_payment(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS cancel_project(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS spawn_tasks_for_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_self(uuid) CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS bump_project_completion() CASCADE;

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS payment_intents CASCADE;
DROP TABLE IF EXISTS task_disputes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS boost_orders CASCADE;
DROP TABLE IF EXISTS collab_matches CASCADE;
DROP TABLE IF EXISTS promote_campaigns CASCADE;
DROP TABLE IF EXISTS abtest_tests CASCADE;
DROP TABLE IF EXISTS insights_studies CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS worker_audiences CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS creator_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS project_type CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_intent_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS withdrawal_status CASCADE;
DROP TYPE IF EXISTS worker_tier CASCADE;
DROP TYPE IF EXISTS audience_platform CASCADE;
DROP TYPE IF EXISTS audience_status CASCADE;
DROP TYPE IF EXISTS ledger_entry_type CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS abtest_kind CASCADE;
DROP TYPE IF EXISTS boost_kind CASCADE;
DROP TYPE IF EXISTS collab_kind CASCADE;
DROP TYPE IF EXISTS subscriber_bracket CASCADE;
DROP TYPE IF EXISTS upload_cadence CASCADE;
DROP TYPE IF EXISTS gender CASCADE;
DROP TYPE IF EXISTS dispute_resolution CASCADE;


-- =============================================================================
-- 1. Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- legacy uuid_generate_v4 (kept for compat)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text matching (search later)


-- =============================================================================
-- 2. Enums
-- =============================================================================

CREATE TYPE project_type           AS ENUM ('insights', 'abtest', 'promote', 'collab', 'boost');
CREATE TYPE project_status         AS ENUM ('draft', 'pending_payment', 'active', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_method         AS ENUM ('flutterwave', 'ccpayment', 'direct_transfer', 'admin_credit');
CREATE TYPE payment_intent_status  AS ENUM ('pending', 'succeeded', 'failed', 'expired', 'refunded');
CREATE TYPE task_status            AS ENUM ('available', 'claimed', 'submitted', 'approved', 'rejected', 'expired');
CREATE TYPE withdrawal_status      AS ENUM ('requested', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE worker_tier            AS ENUM ('A', 'B', 'C');
CREATE TYPE audience_platform      AS ENUM ('twitter', 'instagram', 'tiktok', 'telegram_channel', 'whatsapp_group', 'facebook', 'youtube');
CREATE TYPE audience_status        AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE ledger_entry_type      AS ENUM ('earning', 'withdrawal', 'refund', 'bonus', 'penalty', 'adjustment');
CREATE TYPE notification_channel   AS ENUM ('in_app', 'email', 'telegram', 'telegram_channel');
CREATE TYPE notification_status    AS ENUM ('pending', 'sent', 'failed', 'read');
CREATE TYPE abtest_kind            AS ENUM ('thumbnail', 'title');
CREATE TYPE boost_kind             AS ENUM ('subscriber', 'like', 'comment', 'watch');
CREATE TYPE collab_kind            AS ENUM ('shoutout', 'joint_video', 'live_stream', 'channel_feature');
CREATE TYPE subscriber_bracket     AS ENUM ('0-1k', '1k-10k', '10k-100k', '100k+');
CREATE TYPE upload_cadence         AS ENUM ('less_than_1', '1_to_4', '5_to_8', '9_plus');
CREATE TYPE gender                 AS ENUM ('male', 'female', 'nonbinary', 'prefer_not_to_say');
CREATE TYPE dispute_resolution     AS ENUM ('pending', 'sided_with_creator', 'sided_with_worker', 'split');


-- =============================================================================
-- 3. Helper functions (used inline in RLS + triggers)
-- =============================================================================

-- Is the calling user an admin? Used in RLS policies — security definer so
-- the function can read the users.is_admin flag even when the caller's own
-- SELECT policy would block it.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), FALSE);
$$;

-- Cheap shorthand for `auth.uid() = $1` used in many policies.
CREATE OR REPLACE FUNCTION is_self(target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = target;
$$;

-- Trigger function used on every table with `updated_at`.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 4. Tables
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- users — one account per person; a user can be creator AND/OR worker AND/OR
-- admin. We use boolean role flags instead of a single role enum so dual-role
-- accounts (a creator who also wants to earn as a worker) are first-class.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT UNIQUE NOT NULL,
  full_name             TEXT,
  phone                 TEXT,
  avatar_url            TEXT,

  -- ISO-3166-1 alpha-2 (e.g. 'NG', 'IN'). Drives currency display, country
  -- landing page redirects, payment-method defaults.
  country               TEXT,

  -- ISO-639-1 language code (e.g. 'en', 'hi', 'id', 'ms', 'ta'). Drives UI
  -- language + notification template selection. NOT a list — users pick one
  -- primary; workers list additional languages on worker_profiles.
  preferred_locale      TEXT NOT NULL DEFAULT 'en',

  -- Role flags. A user can hold any combination.
  is_creator            BOOLEAN NOT NULL DEFAULT FALSE,
  is_worker             BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin              BOOLEAN NOT NULL DEFAULT FALSE,

  -- Telegram identity (set when user signs up via Telegram or links it
  -- afterwards). UNIQUE so we can reverse-lookup from bot updates.
  telegram_user_id      BIGINT UNIQUE,
  telegram_username     TEXT,

  -- Referral
  referral_code         TEXT UNIQUE,
  referred_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Engagement
  last_seen_at          TIMESTAMPTZ,
  email_verified_at     TIMESTAMPTZ,
  phone_verified_at     TIMESTAMPTZ,

  -- Suspension
  suspended_at          TIMESTAMPTZ,
  suspended_reason      TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT at_least_one_role CHECK (is_creator OR is_worker OR is_admin)
);

CREATE TRIGGER users_touch BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- creator_profiles — only present if is_creator. 1:1 with users.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE creator_profiles (
  user_id                      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  business_name                TEXT,
  primary_channel_url          TEXT,
  primary_channel_id           TEXT,    -- YouTube channel id (UC...), set when verified
  primary_channel_handle       TEXT,    -- @handle, set when verified
  primary_channel_avatar_url   TEXT,
  primary_channel_verified_at  TIMESTAMPTZ,
  subscriber_bracket           subscriber_bracket,
  channel_niche                TEXT,                 -- single niche tag
  upload_cadence               upload_cadence,
  growth_goals                 TEXT[] NOT NULL DEFAULT '{}',
  how_did_you_hear             TEXT,

  onboarded_at                 TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER creator_profiles_touch BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- worker_profiles — only present if is_worker. 1:1 with users.
--
-- earnings_balance + pending_balance are denormalized for query speed. The
-- ledger_entries table is the canonical record; these columns are kept in
-- sync only via the RPCs below. App code MUST NOT UPDATE them directly.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE worker_profiles (
  user_id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  state_region             TEXT,
  city                     TEXT,
  date_of_birth            DATE,
  gender                   gender,
  languages                TEXT[] NOT NULL DEFAULT '{}',  -- ISO-639-1 codes
  niches                   TEXT[] NOT NULL DEFAULT '{}',
  devices                  TEXT[] NOT NULL DEFAULT '{}',  -- 'mobile' | 'laptop' | 'desktop'
  hours_per_day_available  INT,
  short_bio                TEXT,

  -- Payout — TRC20 USDT address. Can be NULL at signup; required before
  -- first withdrawal. Validation lives in app code (regex T...) since
  -- Postgres regex on text is fine but not airtight against typos.
  usdt_trc20_address       TEXT,

  -- Wallet — derived from ledger_entries. Touched ONLY via RPCs.
  earnings_balance         NUMERIC(14, 4) NOT NULL DEFAULT 0,   -- withdrawable
  pending_balance          NUMERIC(14, 4) NOT NULL DEFAULT 0,   -- in escrow (submitted, awaiting approval)
  lifetime_earned          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  lifetime_withdrawn       NUMERIC(14, 4) NOT NULL DEFAULT 0,

  -- Reputation. 0-100 integer scores. Computed by background jobs +
  -- adjusted manually by admins.
  reliability_score        INT NOT NULL DEFAULT 100,
  quality_score            INT NOT NULL DEFAULT 100,
  completion_rate          NUMERIC(5, 4) NOT NULL DEFAULT 1.0000,  -- 0.0000 to 1.0000
  tier                     worker_tier NOT NULL DEFAULT 'C',

  -- Lifecycle
  onboarded_at             TIMESTAMPTZ,
  last_task_completed_at   TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT earnings_non_negative       CHECK (earnings_balance >= 0),
  CONSTRAINT pending_non_negative        CHECK (pending_balance  >= 0),
  CONSTRAINT lifetime_earned_non_neg     CHECK (lifetime_earned  >= 0),
  CONSTRAINT lifetime_withdrawn_non_neg  CHECK (lifetime_withdrawn >= 0),
  CONSTRAINT reliability_range           CHECK (reliability_score BETWEEN 0 AND 100),
  CONSTRAINT quality_range               CHECK (quality_score BETWEEN 0 AND 100),
  CONSTRAINT completion_rate_range       CHECK (completion_rate BETWEEN 0 AND 1)
);

CREATE TRIGGER worker_profiles_touch BEFORE UPDATE ON worker_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- worker_audiences — external accounts a worker has linked + verified. Used
-- by the Promote product to match campaigns to workers whose actual audience
-- matches the creator's targeting.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE worker_audiences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform                    audience_platform NOT NULL,
  handle                      TEXT NOT NULL,
  profile_url                 TEXT,
  verified_follower_count     INT,
  verification_method         TEXT,   -- 'oauth' | 'screenshot' | 'manual'
  verification_evidence_url   TEXT,   -- screenshot upload, etc.
  status                      audience_status NOT NULL DEFAULT 'pending',
  rejected_reason             TEXT,
  verified_at                 TIMESTAMPTZ,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_handle_per_platform UNIQUE (worker_id, platform, handle)
);

CREATE TRIGGER worker_audiences_touch BEFORE UPDATE ON worker_audiences
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- projects — the master polymorphic table for everything a creator buys.
-- One row per "thing the creator paid for." Detail tables below hold the
-- product-specific fields. Money fields are denormalized here so admin
-- dashboards can sum revenue across types without joining 5 tables.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type                        project_type NOT NULL,
  status                      project_status NOT NULL DEFAULT 'draft',

  -- Human-readable title shown in dashboards / Telegram.
  title                       TEXT NOT NULL,

  -- For Insights / ABTest / Promote / Boost — the target video URL. For
  -- Collab this is NULL (a collab is between channels, not a specific video).
  video_url                   TEXT,
  video_id                    TEXT,           -- extracted YouTube video id
  video_duration_seconds      INT,            -- cached from YouTube API

  -- Targeting payload — flexible by product. Shape:
  --   { countries:[...], languages:[...], niches:[...],
  --     age_min:int?, age_max:int?, genders:[...], min_followers:int? }
  target_demographics         JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Volume targets + progress
  target_response_count       INT,            -- how many tasks the creator paid for
  collected_response_count    INT NOT NULL DEFAULT 0,

  -- Money — set at project creation, never mutated after.
  price_usd                   NUMERIC(14, 4) NOT NULL,
  platform_fee_usd            NUMERIC(14, 4) NOT NULL,   -- 30% (config later)
  worker_pool_usd             NUMERIC(14, 4) NOT NULL,   -- 70% — what tasks pay out
  worker_payout_per_task_usd  NUMERIC(14, 4) NOT NULL,   -- worker_pool / target_response_count

  -- Payment
  paid_at                     TIMESTAMPTZ,

  -- Lifecycle
  launched_at                 TIMESTAMPTZ,
  completed_at                TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  cancelled_reason            TEXT,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_price          CHECK (price_usd >= 0),
  CONSTRAINT positive_pool           CHECK (worker_pool_usd >= 0),
  CONSTRAINT positive_fee            CHECK (platform_fee_usd >= 0),
  CONSTRAINT non_negative_response   CHECK (collected_response_count >= 0),
  CONSTRAINT response_within_target  CHECK (target_response_count IS NULL OR collected_response_count <= target_response_count)
);

CREATE TRIGGER projects_touch BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- insights_studies — Audience Insights specifics. One per insights project.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE insights_studies (
  project_id                 UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Questions — flexible JSON array. Shape per question:
  --   { id:'q1', type:'multiple_choice'|'short_text'|'long_text'|'timestamp'|'rating',
  --     prompt:'...', required:bool, options?:['...'] }
  -- Default question set is used unless creator overrides.
  questions                  JSONB NOT NULL,
  use_default_questions      BOOLEAN NOT NULL DEFAULT TRUE,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- abtest_tests — Thumbnail / Title testing. One per abtest project.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE abtest_tests (
  project_id              UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  kind                    abtest_kind NOT NULL,

  -- Variants array. Shape per variant:
  --   { id:'a', label:'Variant A', image_url:'...'|null, text:'...'|null }
  -- For thumbnail tests, image_url is set; for title tests, text is set.
  variants                JSONB NOT NULL,

  -- Set when the test is closed (winning variant id, vote counts, p-value).
  result_summary          JSONB,
  winning_variant_id      TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- promote_campaigns — workers share the video to their own audiences.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE promote_campaigns (
  project_id              UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,

  -- Which platforms creator wants reach on (subset of audience_platform enum).
  target_platforms        TEXT[] NOT NULL,

  -- Minimum verified followers a worker must have on the chosen platform
  -- to claim a share slot in this campaign.
  min_audience_per_share  INT NOT NULL DEFAULT 100,

  -- Reach + click targets — informational; we count both via UTM.
  target_reach            INT,
  target_clicks           INT,

  -- The creator's blurb that workers can paste / paraphrase when sharing.
  share_message_template  TEXT,

  -- Auto-generated unique UTM campaign value for click attribution.
  utm_campaign            TEXT NOT NULL UNIQUE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- collab_matches — creator-to-creator. Both parties are users (no workers).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE collab_matches (
  project_id             UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  creator_a_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  creator_b_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind                   collab_kind NOT NULL,

  proposed_terms         TEXT NOT NULL,
  agreed_deadline        DATE,

  -- Two-sided escrow: each creator puts up half the fee.
  escrow_a_usd           NUMERIC(14, 4) NOT NULL DEFAULT 0,
  escrow_b_usd           NUMERIC(14, 4) NOT NULL DEFAULT 0,

  -- Two-sided completion confirmation.
  a_confirmed_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  b_confirmed_complete   BOOLEAN NOT NULL DEFAULT FALSE,

  proposed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at            TIMESTAMPTZ,
  declined_at            TIMESTAMPTZ,
  declined_reason        TEXT,

  CONSTRAINT different_creators CHECK (creator_a_id <> creator_b_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- boost_orders — legacy YouTube engagement product. Gated behind feature flag
-- and a separate sub-brand at launch; here for schema completeness.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE boost_orders (
  project_id              UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  kind                    boost_kind NOT NULL,
  target_count            INT NOT NULL,
  delivered_count         INT NOT NULL DEFAULT 0,
  drip_rate_per_day       INT NOT NULL DEFAULT 50,
  niche_match_required    BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- tasks — work units workers claim and complete. ONE table for all product
-- types; the `response` jsonb carries product-specific payload.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type                project_type NOT NULL,           -- denormalized from project for filtering speed
  status              task_status NOT NULL DEFAULT 'available',

  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  worker_payout_usd   NUMERIC(14, 4) NOT NULL,

  -- Product-specific payload. Examples:
  --   Insights: { answers:[{question_id,value},...], session_seconds:int, paused:int }
  --   ABTest:   { vote:'b' }
  --   Promote:  { platform:'twitter', post_url:'https://...', clicks:int }
  --   Boost:    { account_handle:'@x', delivered_action_id:'...' }
  response            JSONB,

  -- For Promote and Boost — proof of work.
  evidence_url        TEXT,

  -- Lifecycle timestamps
  claimed_at          TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  rejected_at         TIMESTAMPTZ,
  rejected_reason     TEXT,
  expires_at          TIMESTAMPTZ,                      -- claim expiry (auto-release)

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT worker_payout_non_neg CHECK (worker_payout_usd >= 0)
);

CREATE TRIGGER tasks_touch BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- task_disputes — workers or creators challenging a task outcome.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE task_disputes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id            UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  raised_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  raised_by_role     TEXT NOT NULL,            -- 'creator' | 'worker'
  reason             TEXT NOT NULL,
  evidence_urls      TEXT[] NOT NULL DEFAULT '{}',
  resolution         dispute_resolution NOT NULL DEFAULT 'pending',
  resolution_notes   TEXT,
  resolved_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────────────────────
-- payment_intents — creator-side payments in. One per project, but workers
-- might pay through multiple methods over time (failed → retry).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payment_intents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  amount_usd          NUMERIC(14, 4) NOT NULL,
  currency_local      TEXT,                              -- 'USD' | 'NGN' | etc.
  amount_local        NUMERIC(14, 2),                    -- original-currency amount

  method              payment_method NOT NULL,
  status              payment_intent_status NOT NULL DEFAULT 'pending',

  provider_ref        TEXT,                              -- Flutterwave tx_ref / CCPayment order_id
  provider_response   JSONB,                             -- raw webhook body, redacted

  failed_reason       TEXT,
  expires_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount_usd > 0)
);

CREATE TRIGGER payment_intents_touch BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- withdrawals — worker-side payouts. USDT TRC20 via CCPayment.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE withdrawals (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  amount_usd               NUMERIC(14, 4) NOT NULL,   -- what's debited from worker balance
  fee_usd                  NUMERIC(14, 4) NOT NULL,   -- platform + network fee
  net_usd                  NUMERIC(14, 4) NOT NULL,   -- what arrives in their wallet

  destination_address      TEXT NOT NULL,             -- TRC20 address — frozen at request time
  status                   withdrawal_status NOT NULL DEFAULT 'requested',

  provider                 TEXT NOT NULL DEFAULT 'ccpayment',
  provider_ref             TEXT,                      -- CCPayment withdrawal id
  provider_tx_hash         TEXT,                      -- TRC20 on-chain tx hash
  failed_reason            TEXT,

  requested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at             TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT min_amount    CHECK (amount_usd >= 1),
  CONSTRAINT net_match     CHECK (net_usd = amount_usd - fee_usd)
);

CREATE TRIGGER withdrawals_touch BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- ledger_entries — append-only audit trail of every worker balance change.
-- We never UPDATE or DELETE rows; the trail is sacrosanct.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE ledger_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  entry_type          ledger_entry_type NOT NULL,

  -- Signed: positive = credit to balance, negative = debit.
  amount_usd          NUMERIC(14, 4) NOT NULL,
  balance_after_usd   NUMERIC(14, 4) NOT NULL,

  -- Optional cross-references — exactly one of these is typically set
  -- (depending on entry_type).
  task_id             UUID REFERENCES tasks(id) ON DELETE SET NULL,
  withdrawal_id       UUID REFERENCES withdrawals(id) ON DELETE SET NULL,

  description         TEXT,
  metadata            JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT amount_nonzero CHECK (amount_usd <> 0)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- notifications — outbound message queue across all channels.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,    -- nullable for broadcast/channel posts

  channel            notification_channel NOT NULL,
  status             notification_status NOT NULL DEFAULT 'pending',
  priority           INT NOT NULL DEFAULT 5,                          -- 0 = highest

  -- Localization: cron worker renders template_key + template_data into
  -- a per-locale string using the user's preferred_locale.
  template_key       TEXT,
  template_data      JSONB,

  -- For simple ad-hoc messages (admin announcements, etc.) — when template_key
  -- is NULL, subject + body are used as-is.
  subject            TEXT,
  body               TEXT,

  -- For email — the address at send time (cache so changes don't break sends).
  email_to           TEXT,
  -- For telegram — the chat id at send time.
  telegram_chat_id   BIGINT,

  attempt_count      INT NOT NULL DEFAULT 0,
  next_attempt_at    TIMESTAMPTZ,
  last_error         TEXT,

  read_at            TIMESTAMPTZ,
  sent_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notifications_touch BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- support_messages — Telegram bot live-support thread storage.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE support_messages (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE SET NULL,
  telegram_user_id         BIGINT,
  telegram_username        TEXT,

  direction                TEXT NOT NULL,                  -- 'inbound' | 'outbound'
  body                     TEXT,
  attachments              JSONB,                          -- [{type:'photo'|'document', file_id, ...}]

  -- Forwarded into the admin Telegram group for live response.
  forwarded_to_group       BOOLEAN NOT NULL DEFAULT FALSE,
  forwarded_message_id     INT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- audit_log — every admin action + security-sensitive event.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  diff            JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 5. Indexes
-- =============================================================================

-- users
CREATE INDEX idx_users_country              ON users(country);
CREATE INDEX idx_users_locale               ON users(preferred_locale);
CREATE INDEX idx_users_is_worker            ON users(is_worker) WHERE is_worker;
CREATE INDEX idx_users_is_creator           ON users(is_creator) WHERE is_creator;
CREATE INDEX idx_users_telegram             ON users(telegram_user_id) WHERE telegram_user_id IS NOT NULL;
CREATE INDEX idx_users_referred_by          ON users(referred_by_user_id) WHERE referred_by_user_id IS NOT NULL;

-- worker_profiles
CREATE INDEX idx_worker_profiles_tier       ON worker_profiles(tier);
CREATE INDEX idx_worker_profiles_languages  ON worker_profiles USING GIN (languages);
CREATE INDEX idx_worker_profiles_niches     ON worker_profiles USING GIN (niches);

-- worker_audiences
CREATE INDEX idx_worker_audiences_worker    ON worker_audiences(worker_id);
CREATE INDEX idx_worker_audiences_platform  ON worker_audiences(platform, status);

-- projects
CREATE INDEX idx_projects_creator           ON projects(creator_id, status);
CREATE INDEX idx_projects_type_status       ON projects(type, status);
CREATE INDEX idx_projects_launched          ON projects(launched_at) WHERE launched_at IS NOT NULL;

-- tasks
CREATE INDEX idx_tasks_project              ON tasks(project_id);
CREATE INDEX idx_tasks_status_type          ON tasks(status, type) WHERE status = 'available';
CREATE INDEX idx_tasks_assignee             ON tasks(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_expiry               ON tasks(expires_at) WHERE expires_at IS NOT NULL AND status = 'claimed';

-- payment_intents
CREATE INDEX idx_payment_intents_project    ON payment_intents(project_id);
CREATE INDEX idx_payment_intents_user       ON payment_intents(user_id, status);
CREATE INDEX idx_payment_intents_provider   ON payment_intents(provider_ref) WHERE provider_ref IS NOT NULL;

-- withdrawals
CREATE INDEX idx_withdrawals_worker         ON withdrawals(worker_id, status);
CREATE INDEX idx_withdrawals_status         ON withdrawals(status);

-- ledger
CREATE INDEX idx_ledger_user                ON ledger_entries(user_id, created_at DESC);
CREATE INDEX idx_ledger_task                ON ledger_entries(task_id) WHERE task_id IS NOT NULL;

-- notifications
CREATE INDEX idx_notifications_user         ON notifications(user_id, status);
CREATE INDEX idx_notifications_pending      ON notifications(status, priority, next_attempt_at) WHERE status = 'pending';

-- support_messages
CREATE INDEX idx_support_user               ON support_messages(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_support_telegram           ON support_messages(telegram_user_id, created_at DESC);

-- audit_log
CREATE INDEX idx_audit_actor                ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_entity               ON audit_log(entity_type, entity_id);


-- =============================================================================
-- 6. Row-level security
-- =============================================================================
-- Strategy:
--   - Every table has RLS enabled.
--   - SELECT/UPDATE/INSERT/DELETE policies are explicit.
--   - Admins (is_admin()) bypass via the catch-all policy on each table.
--   - The `service_role` Supabase key bypasses RLS server-side (used by
--     trusted RPCs and webhooks). App-facing code uses anon/authed keys.
-- =============================================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_audiences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_studies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE abtest_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE promote_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_disputes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;


-- ─── users ──────────────────────────────────────────────────────────────────
CREATE POLICY users_select_self    ON users FOR SELECT USING (is_self(id) OR is_admin());
CREATE POLICY users_update_self    ON users FOR UPDATE USING (is_self(id)) WITH CHECK (is_self(id) AND is_admin = (SELECT is_admin FROM users WHERE id = auth.uid()));  -- can't self-promote
CREATE POLICY users_admin_all      ON users FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── creator_profiles ───────────────────────────────────────────────────────
CREATE POLICY cp_select_self       ON creator_profiles FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY cp_insert_self       ON creator_profiles FOR INSERT WITH CHECK (is_self(user_id));
CREATE POLICY cp_update_self       ON creator_profiles FOR UPDATE USING (is_self(user_id)) WITH CHECK (is_self(user_id));
CREATE POLICY cp_admin_all         ON creator_profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── worker_profiles ────────────────────────────────────────────────────────
CREATE POLICY wp_select_self       ON worker_profiles FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY wp_insert_self       ON worker_profiles FOR INSERT WITH CHECK (is_self(user_id));
CREATE POLICY wp_update_self       ON worker_profiles FOR UPDATE USING (is_self(user_id))
  WITH CHECK (
    is_self(user_id)
    AND earnings_balance   = (SELECT earnings_balance   FROM worker_profiles WHERE user_id = auth.uid())
    AND pending_balance    = (SELECT pending_balance    FROM worker_profiles WHERE user_id = auth.uid())
    AND lifetime_earned    = (SELECT lifetime_earned    FROM worker_profiles WHERE user_id = auth.uid())
    AND lifetime_withdrawn = (SELECT lifetime_withdrawn FROM worker_profiles WHERE user_id = auth.uid())
    AND tier               = (SELECT tier               FROM worker_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY wp_admin_all         ON worker_profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── worker_audiences ───────────────────────────────────────────────────────
CREATE POLICY wa_select_self       ON worker_audiences FOR SELECT USING (is_self(worker_id) OR is_admin());
CREATE POLICY wa_insert_self       ON worker_audiences FOR INSERT WITH CHECK (is_self(worker_id));
CREATE POLICY wa_update_self       ON worker_audiences FOR UPDATE USING (is_self(worker_id)) WITH CHECK (is_self(worker_id) AND status = 'pending');
CREATE POLICY wa_delete_self       ON worker_audiences FOR DELETE USING (is_self(worker_id));
CREATE POLICY wa_admin_all         ON worker_audiences FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── projects ───────────────────────────────────────────────────────────────
-- Creators see their own. Workers see projects where they have an assigned task.
-- Both can see launched/active projects via the task feed (the SELECT
-- happens server-side through RPCs that join — workers don't query
-- `projects` directly in the task-discovery path).
CREATE POLICY proj_select_creator  ON projects FOR SELECT USING (is_self(creator_id) OR is_admin());
CREATE POLICY proj_select_worker   ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.project_id = projects.id AND tasks.assigned_to = auth.uid())
);
CREATE POLICY proj_insert_creator  ON projects FOR INSERT WITH CHECK (is_self(creator_id));
CREATE POLICY proj_update_creator  ON projects FOR UPDATE USING (is_self(creator_id) AND status IN ('draft', 'pending_payment'));
CREATE POLICY proj_admin_all       ON projects FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── per-product detail tables (insights/abtest/promote/collab/boost) ───────
CREATE POLICY ins_select           ON insights_studies FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (is_self(p.creator_id) OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = auth.uid())))
  OR is_admin()
);
CREATE POLICY ins_admin_all        ON insights_studies FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY ins_insert_creator   ON insights_studies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_self(p.creator_id))
);

CREATE POLICY abt_select           ON abtest_tests FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (is_self(p.creator_id) OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = auth.uid())))
  OR is_admin()
);
CREATE POLICY abt_admin_all        ON abtest_tests FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY abt_insert_creator   ON abtest_tests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_self(p.creator_id))
);

CREATE POLICY prm_select           ON promote_campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (is_self(p.creator_id) OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = auth.uid())))
  OR is_admin()
);
CREATE POLICY prm_admin_all        ON promote_campaigns FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY prm_insert_creator   ON promote_campaigns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_self(p.creator_id))
);

CREATE POLICY clb_select           ON collab_matches FOR SELECT USING (
  is_self(creator_a_id) OR is_self(creator_b_id) OR is_admin()
);
CREATE POLICY clb_admin_all        ON collab_matches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY clb_insert_a         ON collab_matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_self(p.creator_id))
  AND is_self(creator_a_id)
);

CREATE POLICY bst_select           ON boost_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (is_self(p.creator_id) OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assigned_to = auth.uid())))
  OR is_admin()
);
CREATE POLICY bst_admin_all        ON boost_orders FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── tasks ──────────────────────────────────────────────────────────────────
-- Workers see: tasks assigned to them + available tasks (server-side filtered
-- by their tier/niche/language in the RPC). Creators see tasks of their projects.
CREATE POLICY tasks_select_assignee   ON tasks FOR SELECT USING (is_self(assigned_to));
CREATE POLICY tasks_select_creator    ON tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_self(p.creator_id))
);
-- "available" tasks visible to any logged-in worker (further filtering by RPC).
CREATE POLICY tasks_select_available  ON tasks FOR SELECT USING (
  status = 'available'
  AND assigned_to IS NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_worker)
);
CREATE POLICY tasks_admin_all         ON tasks FOR ALL USING (is_admin()) WITH CHECK (is_admin());
-- Direct INSERT/UPDATE/DELETE are blocked for non-admins; all writes go through RPCs.

-- ─── task_disputes ──────────────────────────────────────────────────────────
CREATE POLICY td_select_party      ON task_disputes FOR SELECT USING (
  is_self(raised_by_user_id)
  OR EXISTS (
    SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_id AND (is_self(t.assigned_to) OR is_self(p.creator_id))
  )
  OR is_admin()
);
CREATE POLICY td_insert_party      ON task_disputes FOR INSERT WITH CHECK (is_self(raised_by_user_id));
CREATE POLICY td_admin_all         ON task_disputes FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── payment_intents ────────────────────────────────────────────────────────
CREATE POLICY pi_select_self       ON payment_intents FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY pi_insert_self       ON payment_intents FOR INSERT WITH CHECK (is_self(user_id));
CREATE POLICY pi_admin_all         ON payment_intents FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── withdrawals ────────────────────────────────────────────────────────────
CREATE POLICY wd_select_self       ON withdrawals FOR SELECT USING (is_self(worker_id) OR is_admin());
CREATE POLICY wd_admin_all         ON withdrawals FOR ALL USING (is_admin()) WITH CHECK (is_admin());
-- INSERTs go through request_withdrawal RPC only.

-- ─── ledger_entries (read-only to user) ─────────────────────────────────────
CREATE POLICY le_select_self       ON ledger_entries FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY le_admin_all         ON ledger_entries FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── notifications ──────────────────────────────────────────────────────────
CREATE POLICY notif_select_self    ON notifications FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY notif_update_self    ON notifications FOR UPDATE USING (is_self(user_id)) WITH CHECK (is_self(user_id));  -- mark read
CREATE POLICY notif_admin_all      ON notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── support_messages ───────────────────────────────────────────────────────
CREATE POLICY sm_select_self       ON support_messages FOR SELECT USING (is_self(user_id) OR is_admin());
CREATE POLICY sm_insert_self       ON support_messages FOR INSERT WITH CHECK (is_self(user_id) OR user_id IS NULL);
CREATE POLICY sm_admin_all         ON support_messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── audit_log ──────────────────────────────────────────────────────────────
CREATE POLICY al_admin_all         ON audit_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- =============================================================================
-- 7. RPCs — every state change that needs atomicity goes through here.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- spawn_tasks_for_project
-- Internal helper called by capture_project_payment. Creates `target_response_count`
-- task rows for the project.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION spawn_tasks_for_project(p_project_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj      projects%ROWTYPE;
  n_created INT := 0;
BEGIN
  SELECT * INTO proj FROM projects WHERE id = p_project_id;
  IF proj IS NULL THEN
    RAISE EXCEPTION 'project not found: %', p_project_id;
  END IF;

  -- Collab has no worker tasks (creator-to-creator).
  IF proj.type = 'collab' THEN
    RETURN 0;
  END IF;

  IF proj.target_response_count IS NULL OR proj.target_response_count <= 0 THEN
    RAISE EXCEPTION 'project has no target_response_count: %', p_project_id;
  END IF;

  INSERT INTO tasks (project_id, type, status, worker_payout_usd)
  SELECT proj.id, proj.type, 'available', proj.worker_payout_per_task_usd
  FROM generate_series(1, proj.target_response_count);

  GET DIAGNOSTICS n_created = ROW_COUNT;
  RETURN n_created;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- capture_project_payment(project_id, payment_intent_id)
-- Called from the payment webhook after the creator's payment succeeds.
-- Marks the project paid + active, spawns tasks.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION capture_project_payment(p_project_id UUID, p_intent_id UUID)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intent   payment_intents%ROWTYPE;
  proj     projects%ROWTYPE;
BEGIN
  SELECT * INTO intent FROM payment_intents WHERE id = p_intent_id FOR UPDATE;
  IF intent IS NULL THEN
    RAISE EXCEPTION 'payment intent not found';
  END IF;
  IF intent.status <> 'succeeded' THEN
    RAISE EXCEPTION 'payment intent not succeeded (status: %)', intent.status;
  END IF;

  SELECT * INTO proj FROM projects WHERE id = p_project_id FOR UPDATE;
  IF proj IS NULL THEN
    RAISE EXCEPTION 'project not found';
  END IF;
  IF proj.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'project not pending payment (status: %)', proj.status;
  END IF;

  UPDATE projects
     SET status      = 'active',
         paid_at     = NOW(),
         launched_at = NOW()
   WHERE id = p_project_id
  RETURNING * INTO proj;

  PERFORM spawn_tasks_for_project(p_project_id);

  RETURN proj;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- cancel_project(project_id, reason)
-- Refund + cancel. Allowed only when no tasks have been approved yet.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_project(p_project_id UUID, p_reason TEXT)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj   projects%ROWTYPE;
  done   INT;
BEGIN
  SELECT * INTO proj FROM projects WHERE id = p_project_id FOR UPDATE;
  IF proj IS NULL THEN
    RAISE EXCEPTION 'project not found';
  END IF;

  SELECT COUNT(*) INTO done FROM tasks WHERE project_id = p_project_id AND status = 'approved';
  IF done > 0 THEN
    RAISE EXCEPTION 'cannot cancel: % task(s) already approved', done;
  END IF;

  UPDATE tasks
     SET status = 'expired'
   WHERE project_id = p_project_id
     AND status IN ('available', 'claimed', 'submitted');

  UPDATE projects
     SET status          = 'cancelled',
         cancelled_at    = NOW(),
         cancelled_reason= p_reason
   WHERE id = p_project_id
  RETURNING * INTO proj;

  RETURN proj;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- claim_task(task_id)
-- Atomically assign an `available` task to the calling worker. Returns the
-- updated row; raises if not available or worker is ineligible.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_task(p_task_id UUID)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller    UUID := auth.uid();
  t         tasks%ROWTYPE;
  is_worker BOOL;
BEGIN
  SELECT is_worker INTO is_worker FROM users WHERE id = caller;
  IF NOT COALESCE(is_worker, FALSE) THEN
    RAISE EXCEPTION 'not a worker';
  END IF;

  UPDATE tasks
     SET status      = 'claimed',
         assigned_to = caller,
         claimed_at  = NOW(),
         expires_at  = NOW() + INTERVAL '2 hours'
   WHERE id = p_task_id
     AND status = 'available'
     AND assigned_to IS NULL
  RETURNING * INTO t;

  IF t IS NULL THEN
    RAISE EXCEPTION 'task not available';
  END IF;

  RETURN t;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- submit_task(task_id, response, evidence_url)
-- Worker submits their response. Moves worker_payout into pending_balance.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_task(p_task_id UUID, p_response JSONB, p_evidence_url TEXT)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  t      tasks%ROWTYPE;
BEGIN
  UPDATE tasks
     SET status        = 'submitted',
         response      = p_response,
         evidence_url  = p_evidence_url,
         submitted_at  = NOW()
   WHERE id = p_task_id
     AND assigned_to = caller
     AND status = 'claimed'
  RETURNING * INTO t;

  IF t IS NULL THEN
    RAISE EXCEPTION 'task not claimed by you or not in claimed state';
  END IF;

  UPDATE worker_profiles
     SET pending_balance = pending_balance + t.worker_payout_usd
   WHERE user_id = caller;

  RETURN t;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- approve_task(task_id)
-- Admin or auto-approval. Moves pending → earnings and writes a ledger entry.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_task(p_task_id UUID)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t        tasks%ROWTYPE;
  new_bal  NUMERIC(14, 4);
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  UPDATE tasks
     SET status      = 'approved',
         approved_at = NOW()
   WHERE id = p_task_id
     AND status = 'submitted'
  RETURNING * INTO t;

  IF t IS NULL THEN
    RAISE EXCEPTION 'task not in submitted state';
  END IF;

  UPDATE worker_profiles
     SET pending_balance        = pending_balance - t.worker_payout_usd,
         earnings_balance       = earnings_balance + t.worker_payout_usd,
         lifetime_earned        = lifetime_earned + t.worker_payout_usd,
         last_task_completed_at = NOW()
   WHERE user_id = t.assigned_to
  RETURNING earnings_balance INTO new_bal;

  INSERT INTO ledger_entries (user_id, entry_type, amount_usd, balance_after_usd, task_id, description)
  VALUES (t.assigned_to, 'earning', t.worker_payout_usd, new_bal, t.id, 'Task approved');

  UPDATE projects
     SET collected_response_count = collected_response_count + 1,
         completed_at = CASE
           WHEN collected_response_count + 1 >= target_response_count THEN NOW()
           ELSE completed_at
         END,
         status = CASE
           WHEN collected_response_count + 1 >= target_response_count THEN 'completed'::project_status
           ELSE status
         END
   WHERE id = t.project_id;

  RETURN t;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- reject_task(task_id, reason)
-- Admin rejects. Releases worker's pending balance and returns task to pool.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_task(p_task_id UUID, p_reason TEXT)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t tasks%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  UPDATE tasks
     SET status          = 'rejected',
         rejected_at     = NOW(),
         rejected_reason = p_reason
   WHERE id = p_task_id
     AND status = 'submitted'
  RETURNING * INTO t;

  IF t IS NULL THEN
    RAISE EXCEPTION 'task not in submitted state';
  END IF;

  UPDATE worker_profiles
     SET pending_balance = pending_balance - t.worker_payout_usd
   WHERE user_id = t.assigned_to;

  -- Recycle a fresh task slot back into the pool so the project can still finish.
  INSERT INTO tasks (project_id, type, status, worker_payout_usd)
  VALUES (t.project_id, t.type, 'available', t.worker_payout_usd);

  RETURN t;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- expire_stale_claims()
-- Cron job — release tasks claimed > 2h ago that haven't been submitted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_stale_claims()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE tasks
     SET status      = 'available',
         assigned_to = NULL,
         claimed_at  = NULL,
         expires_at  = NULL
   WHERE status = 'claimed'
     AND expires_at < NOW();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- request_withdrawal(amount_usd, destination_address)
-- Worker debits their balance; creates a withdrawal in 'requested' status for
-- admin/cron to push to CCPayment.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION request_withdrawal(p_amount NUMERIC, p_address TEXT)
RETURNS withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller   UUID := auth.uid();
  wallet   worker_profiles%ROWTYPE;
  fee      NUMERIC(14, 4) := 1.00;   -- flat $1 (network + provider). Tuned in config later.
  net      NUMERIC(14, 4);
  w        withdrawals%ROWTYPE;
  new_bal  NUMERIC(14, 4);
BEGIN
  IF p_amount < 10 THEN
    RAISE EXCEPTION 'minimum withdrawal is $10';
  END IF;
  IF p_address IS NULL OR length(p_address) < 30 THEN
    RAISE EXCEPTION 'invalid destination address';
  END IF;

  SELECT * INTO wallet FROM worker_profiles WHERE user_id = caller FOR UPDATE;
  IF wallet IS NULL THEN
    RAISE EXCEPTION 'no worker profile';
  END IF;
  IF wallet.earnings_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  net := p_amount - fee;

  INSERT INTO withdrawals (worker_id, amount_usd, fee_usd, net_usd, destination_address, status)
  VALUES (caller, p_amount, fee, net, p_address, 'requested')
  RETURNING * INTO w;

  UPDATE worker_profiles
     SET earnings_balance = earnings_balance - p_amount
   WHERE user_id = caller
  RETURNING earnings_balance INTO new_bal;

  INSERT INTO ledger_entries (user_id, entry_type, amount_usd, balance_after_usd, withdrawal_id, description)
  VALUES (caller, 'withdrawal', -p_amount, new_bal, w.id, 'Withdrawal requested');

  RETURN w;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- finalize_withdrawal(withdrawal_id, tx_hash, provider_ref)
-- Webhook callback: CCPayment confirmed the on-chain TRC20 transaction.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION finalize_withdrawal(p_id UUID, p_tx_hash TEXT, p_provider_ref TEXT)
RETURNS withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w withdrawals%ROWTYPE;
BEGIN
  UPDATE withdrawals
     SET status            = 'completed',
         provider_tx_hash  = p_tx_hash,
         provider_ref      = COALESCE(p_provider_ref, provider_ref),
         processed_at      = COALESCE(processed_at, NOW()),
         completed_at      = NOW()
   WHERE id = p_id
     AND status IN ('requested', 'processing')
  RETURNING * INTO w;

  IF w IS NULL THEN
    RAISE EXCEPTION 'withdrawal not found or already in terminal state';
  END IF;

  UPDATE worker_profiles
     SET lifetime_withdrawn = lifetime_withdrawn + w.net_usd
   WHERE user_id = w.worker_id;

  RETURN w;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- fail_withdrawal(withdrawal_id, reason)
-- Refund the worker if the payout failed.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fail_withdrawal(p_id UUID, p_reason TEXT)
RETURNS withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w        withdrawals%ROWTYPE;
  new_bal  NUMERIC(14, 4);
BEGIN
  UPDATE withdrawals
     SET status        = 'failed',
         failed_reason = p_reason,
         processed_at  = COALESCE(processed_at, NOW())
   WHERE id = p_id
     AND status IN ('requested', 'processing')
  RETURNING * INTO w;

  IF w IS NULL THEN
    RAISE EXCEPTION 'withdrawal not found or already terminal';
  END IF;

  UPDATE worker_profiles
     SET earnings_balance = earnings_balance + w.amount_usd
   WHERE user_id = w.worker_id
  RETURNING earnings_balance INTO new_bal;

  INSERT INTO ledger_entries (user_id, entry_type, amount_usd, balance_after_usd, withdrawal_id, description)
  VALUES (w.worker_id, 'adjustment', w.amount_usd, new_bal, w.id, 'Withdrawal failed — refunded');

  RETURN w;
END;
$$;


-- =============================================================================
-- 8. Auth-trigger glue
-- =============================================================================

-- When Supabase Auth creates a new auth.users row, mirror it into public.users.
-- Role flags are set later from the application onboarding flow (the user
-- picks "Sign up as creator" or "Sign up as worker"). Default: worker.
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();


-- =============================================================================
-- 9. Grants — explicit (Supabase's default grants are permissive)
-- =============================================================================

GRANT EXECUTE ON FUNCTION is_admin()                                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_self(UUID)                                 TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_task(UUID)                              TO authenticated;
GRANT EXECUTE ON FUNCTION submit_task(UUID, JSONB, TEXT)                TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task(UUID)                            TO authenticated;
GRANT EXECUTE ON FUNCTION reject_task(UUID, TEXT)                       TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal(NUMERIC, TEXT)             TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_project(UUID, TEXT)                    TO authenticated;
-- Webhook-only RPCs are NOT granted to authenticated; they run via service_role.


-- =============================================================================
-- 10. Storage — Supabase Storage buckets + RLS policies.
-- =============================================================================
-- Buckets:
--   - abtest-thumbnails  Public, ≤4 thumbnails/test. Uploaded by creators
--                        during the ABTest wizard.
--   - audience-evidence  Private. Screenshots workers upload during the
--                        Promote-audience verification flow.
--   - project-uploads    Public. Reserved for future per-project assets.
--
-- Note: the storage extension must be enabled on the Supabase project (it
-- is by default). Bucket creation via INSERT works in modern Supabase.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('abtest-thumbnails',  'abtest-thumbnails',  TRUE,  10485760,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('audience-evidence',  'audience-evidence',  FALSE, 10485760,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('project-uploads',    'project-uploads',    TRUE,  10485760,  NULL)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types= EXCLUDED.allowed_mime_types;

-- ─── abtest-thumbnails policies ─────────────────────────────────────────────
-- Creators upload under their own user-id folder. Anyone can read (public
-- bucket — workers need to see thumbnails).
DROP POLICY IF EXISTS "abtest_thumbnails_upload" ON storage.objects;
CREATE POLICY "abtest_thumbnails_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'abtest-thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "abtest_thumbnails_owner_delete" ON storage.objects;
CREATE POLICY "abtest_thumbnails_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'abtest-thumbnails'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "abtest_thumbnails_public_read" ON storage.objects;
CREATE POLICY "abtest_thumbnails_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'abtest-thumbnails');

-- ─── audience-evidence policies ─────────────────────────────────────────────
-- Workers upload their own. Admins read all. Owner reads own.
DROP POLICY IF EXISTS "audience_evidence_upload" ON storage.objects;
CREATE POLICY "audience_evidence_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audience-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "audience_evidence_self_read" ON storage.objects;
CREATE POLICY "audience_evidence_self_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'audience-evidence'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

DROP POLICY IF EXISTS "audience_evidence_owner_delete" ON storage.objects;
CREATE POLICY "audience_evidence_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'audience-evidence'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

-- ─── project-uploads policies (open by default — locked down when needed) ──
DROP POLICY IF EXISTS "project_uploads_upload" ON storage.objects;
CREATE POLICY "project_uploads_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "project_uploads_public_read" ON storage.objects;
CREATE POLICY "project_uploads_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-uploads');


-- =============================================================================
-- Done.
-- =============================================================================
-- After applying:
--   1. Run seed.sql to promote your first admin user.
--   2. Set up pg_cron jobs:
--        - expire_stale_claims()                       every 5 minutes
--        - notification processor (cron API endpoint)  every 30 seconds
-- =============================================================================
