-- =============================================================================
-- Migration 0006 — Engagement (referrals + streaks + leaderboard)
-- =============================================================================
-- Apply AFTER 0005.
--
-- Adds:
--   * Referral chain on users (referred_by_user_id + paid flag)
--   * Streak fields on users (current count + last verified-completion day)
--   * 'referral_bonus' added to transaction_type enum
--   * Trigger on completions that, when a row flips to verified=true:
--        - bumps the worker's streak
--        - if this is the worker's FIRST verified completion AND they were
--          referred, pays the referrer a one-time bonus credit
--   * leaderboard_top() RPC — top earners this week / month, public-safe shape
-- =============================================================================

-- 1. Referral + streak columns on users
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referred_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_bonus_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_count          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_day       DATE;

-- Self-referral prevention (defensive; the API also blocks at signup time).
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_no_self_referral;
ALTER TABLE users
  ADD CONSTRAINT chk_no_self_referral CHECK (referred_by_user_id IS NULL OR referred_by_user_id <> id);

CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_user_id)
  WHERE referred_by_user_id IS NOT NULL;

-- 2. New transaction type for the referral payout
-- ---------------------------------------------------------------------------
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'referral_bonus';

-- 3. Engagement trigger — runs alongside on_completion_state_change.
-- ---------------------------------------------------------------------------
-- Fires when a completion transitions to verified=true. Does two things:
--   (a) Bumps the worker's streak.
--   (b) If this is the worker's first-ever verified completion AND they were
--       referred, credits the referrer a one-time bonus and writes a
--       transaction log entry.
--
-- Atomic with the verification itself because triggers run in the same
-- transaction. If anything in here fails, the verify rolls back too.

CREATE OR REPLACE FUNCTION on_completion_verified_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker users%ROWTYPE;
  v_referrer users%ROWTYPE;
  v_bonus_amount DECIMAL(10, 2) := 50.00;  -- ₦50 per successful referral
  v_today DATE := (NEW.verified_at AT TIME ZONE 'UTC')::date;
  v_new_streak INTEGER;
  v_verified_total INTEGER;
  v_new_balance DECIMAL(12, 2);
BEGIN
  -- Only react on the verified=true transition.
  IF NOT (NEW.verified = TRUE AND (OLD.verified IS DISTINCT FROM TRUE)) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_worker FROM users WHERE id = NEW.worker_id;

  -- (a) Streak update
  -- ----------------------------------------------------------------------
  -- Today's already counted → no-op. Otherwise either continue or reset.
  IF v_worker.streak_last_day IS NULL THEN
    v_new_streak := 1;
  ELSIF v_worker.streak_last_day = v_today THEN
    v_new_streak := v_worker.streak_count;       -- same-day, no change
  ELSIF v_worker.streak_last_day = v_today - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_worker.streak_count, 0) + 1;
  ELSE
    v_new_streak := 1;                            -- gap → reset
  END IF;

  UPDATE users
  SET streak_count = v_new_streak,
      streak_last_day = v_today
  WHERE id = v_worker.id;

  -- (b) Referral bonus — first verified completion only
  -- ----------------------------------------------------------------------
  -- Count this worker's verified completions including the current row.
  SELECT COUNT(*) INTO v_verified_total
  FROM completions
  WHERE worker_id = v_worker.id AND verified = TRUE;

  IF v_verified_total = 1
     AND v_worker.referred_by_user_id IS NOT NULL
     AND v_worker.referral_bonus_paid_at IS NULL
  THEN
    SELECT * INTO v_referrer FROM users WHERE id = v_worker.referred_by_user_id;
    IF FOUND THEN
      -- Credit the referrer's wallet
      UPDATE users
      SET wallet_balance = wallet_balance + v_bonus_amount
      WHERE id = v_referrer.id
      RETURNING wallet_balance INTO v_new_balance;

      -- Mark this referral as paid (don't double-pay even if completion is
      -- somehow re-verified or reverted+verified again).
      UPDATE users
      SET referral_bonus_paid_at = NOW()
      WHERE id = v_worker.id;

      -- Ledger entry
      INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, description)
      VALUES (
        v_referrer.id,
        'referral_bonus',
        v_bonus_amount,
        v_new_balance,
        v_worker.id,
        'Referral bonus for ' || COALESCE(v_worker.full_name, v_worker.email)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_completion_engagement ON completions;
CREATE TRIGGER trg_completion_engagement
AFTER UPDATE ON completions
FOR EACH ROW EXECUTE FUNCTION on_completion_verified_engagement();

-- 4. Leaderboard RPC — top earners in a rolling window
-- ---------------------------------------------------------------------------
-- Returns a public-safe shape: first name, telegram username (optional),
-- avatar, total earned. NO emails, NO surnames, NO wallet balances.

CREATE OR REPLACE FUNCTION leaderboard_top(p_window TEXT DEFAULT 'week', p_limit INT DEFAULT 10)
RETURNS TABLE (
  rank          INT,
  user_id       UUID,
  display_name  TEXT,
  telegram_username TEXT,
  avatar_url    TEXT,
  total_earned  DECIMAL(12, 2),
  task_count    INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  v_since := CASE
    WHEN p_window = 'today' THEN NOW() - INTERVAL '24 hours'
    WHEN p_window = 'month' THEN NOW() - INTERVAL '30 days'
    WHEN p_window = 'all'   THEN '-infinity'::TIMESTAMPTZ
    ELSE                          NOW() - INTERVAL '7 days'
  END;

  RETURN QUERY
  WITH scored AS (
    SELECT
      c.worker_id,
      SUM(c.payout_amount)::DECIMAL(12, 2) AS earned,
      COUNT(*)::INTEGER                    AS tasks
    FROM completions c
    WHERE c.verified = TRUE
      AND c.verified_at >= v_since
    GROUP BY c.worker_id
  )
  SELECT
    (ROW_NUMBER() OVER (ORDER BY s.earned DESC))::INT AS rank,
    u.id,
    -- Use first part of full_name if available, else telegram first name,
    -- else email-local-part, else a generic "Worker".
    COALESCE(
      NULLIF(split_part(u.full_name, ' ', 1), ''),
      NULLIF(split_part(u.email, '@', 1), ''),
      'Worker'
    ) AS display_name,
    u.telegram_username,
    u.avatar_url,
    s.earned,
    s.tasks
  FROM scored s
  JOIN users u ON u.id = s.worker_id
  ORDER BY s.earned DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_top(TEXT, INT) TO authenticated;

DO $$ BEGIN
  RAISE NOTICE 'migration 0006_engagement applied. Streaks + referrals + leaderboard ready.';
END $$;
