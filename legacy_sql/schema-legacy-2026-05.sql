-- =============================================================================
-- Highzcore — Authoritative Schema (M0)
-- =============================================================================
-- This is the SINGLE source of truth. The seven legacy SQL files in
-- legacy_sql/ are deprecated and must not be applied.
--
-- This file is idempotent and destructive: running it WIPES the public
-- schema tables it owns and rebuilds them. Run against an empty project
-- or one whose data you are willing to lose.
--
-- To apply: paste into Supabase SQL Editor (or run via psql).
-- After applying, run seed.sql if you want a starter admin user.
-- =============================================================================


-- =============================================================================
-- 0. Reset
-- =============================================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS completions CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;          -- legacy, never used by code
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS verify_completion(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS reject_completion(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS mark_withdrawal_paid(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS sync_contract_pending_count() CASCADE;
DROP FUNCTION IF EXISTS bump_contract_on_completion() CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS withdrawal_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;


-- =============================================================================
-- 1. Extensions & enums
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role         AS ENUM ('client', 'worker', 'admin');
CREATE TYPE contract_status   AS ENUM ('pending_payment', 'active', 'completed', 'cancelled');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE transaction_type  AS ENUM ('task_completion', 'withdrawal', 'refund', 'adjustment');


-- =============================================================================
-- 2. Tables
-- =============================================================================

-- Users mirror auth.users + role + wallet + YouTube grant state.
CREATE TABLE users (
  id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       TEXT UNIQUE NOT NULL,
  role                        user_role NOT NULL DEFAULT 'worker',
  full_name                   TEXT,
  avatar_url                  TEXT,
  google_id                   TEXT,

  -- YouTube grant lives on the user; workers only.
  -- Separate from the auth session token: this is the OAuth access token
  -- with youtube.readonly scope, granted on-demand from the worker dashboard.
  google_token                TEXT,
  google_refresh_token        TEXT,
  youtube_access_granted      BOOLEAN NOT NULL DEFAULT FALSE,
  youtube_access_granted_at   TIMESTAMPTZ,

  -- Wallet — workers only. NEVER write to this directly from app code;
  -- use the verify_completion / mark_withdrawal_paid RPCs so the
  -- balance stays consistent with the transactions ledger.
  wallet_balance              DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT wallet_non_negative CHECK (wallet_balance >= 0)
);

-- Contracts are client campaigns: "get me N subscribers on this channel."
CREATE TABLE contracts (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  channel_name             TEXT NOT NULL,
  channel_url              TEXT NOT NULL,
  channel_id               TEXT,             -- YouTube channel id, set when verified
  channel_image            TEXT,

  target_subscribers       INTEGER NOT NULL,
  price_per_subscriber     DECIMAL(10, 2) NOT NULL,
  total_amount             DECIMAL(12, 2) NOT NULL,
  worker_payout_per_task   DECIMAL(10, 2) NOT NULL DEFAULT 120.00,

  -- Maintained by triggers / verify_completion RPC.
  verified_count           INTEGER NOT NULL DEFAULT 0,
  pending_count            INTEGER NOT NULL DEFAULT 0,

  status                   contract_status NOT NULL DEFAULT 'pending_payment',
  payment_proof_url        TEXT,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at             TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,

  CONSTRAINT positive_target CHECK (target_subscribers > 0),
  CONSTRAINT positive_price  CHECK (price_per_subscriber > 0),
  CONSTRAINT positive_total  CHECK (total_amount > 0)
);

-- Completions: a worker claims a contract slot. One claim per (worker, contract).
CREATE TABLE completions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  payout_amount   DECIMAL(10, 2) NOT NULL,

  -- Lifecycle timestamps
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ,                 -- when worker pressed "I'm done"
  verified_at    TIMESTAMPTZ,
  verified_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_at    TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Optional evidence
  screenshot_url  TEXT,
  notes           TEXT,

  UNIQUE (contract_id, worker_id)
);

-- Withdrawals: worker payout requests.
CREATE TABLE withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(12, 2) NOT NULL,
  status          withdrawal_status NOT NULL DEFAULT 'pending',
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  admin_notes     TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  processed_by    UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT withdrawal_min CHECK (amount >= 1000.00)
);

-- Ledger of all wallet movements. Append-only; never UPDATE/DELETE rows.
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            transaction_type NOT NULL,
  amount          DECIMAL(12, 2) NOT NULL,         -- signed: credit positive, debit negative
  balance_after   DECIMAL(12, 2) NOT NULL,
  reference_id    UUID,                            -- completion_id, withdrawal_id, etc.
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages: client ↔ admin per-contract chat.
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role     user_role NOT NULL,
  message         TEXT NOT NULL,
  media_url       TEXT,
  media_type      TEXT CHECK (media_type IS NULL OR media_type IN ('image', 'video')),
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,  -- e.g. pinned payment instructions
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  -- For the reminder scheduler (M1): tracks when we last nudged the other side.
  reminder_sent_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 3. Indexes
-- =============================================================================

CREATE INDEX idx_users_email                ON users(email);
CREATE INDEX idx_users_role                 ON users(role);

CREATE INDEX idx_contracts_client           ON contracts(client_id);
CREATE INDEX idx_contracts_status           ON contracts(status);
CREATE INDEX idx_contracts_status_active    ON contracts(status) WHERE status = 'active';
CREATE INDEX idx_contracts_created          ON contracts(created_at DESC);

CREATE INDEX idx_completions_worker         ON completions(worker_id);
CREATE INDEX idx_completions_contract       ON completions(contract_id);
CREATE INDEX idx_completions_unverified     ON completions(verified) WHERE verified = FALSE;

CREATE INDEX idx_withdrawals_worker         ON withdrawals(worker_id);
CREATE INDEX idx_withdrawals_status         ON withdrawals(status);

CREATE INDEX idx_transactions_user          ON transactions(user_id, created_at DESC);

CREATE INDEX idx_messages_contract          ON messages(contract_id, created_at);
CREATE INDEX idx_messages_unread            ON messages(contract_id, is_read) WHERE is_read = FALSE;


-- =============================================================================
-- 4. Helpers & triggers
-- =============================================================================

-- updated_at touch
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_contracts_updated_at  BEFORE UPDATE ON contracts  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Keep contracts.pending_count in lock-step with claims.
-- A row in completions is "pending" iff verified=false AND rejected_at IS NULL.
CREATE OR REPLACE FUNCTION sync_contract_pending_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.verified = FALSE AND NEW.rejected_at IS NULL THEN
      UPDATE contracts SET pending_count = pending_count + 1 WHERE id = NEW.contract_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.verified = FALSE AND OLD.rejected_at IS NULL THEN
      UPDATE contracts SET pending_count = GREATEST(pending_count - 1, 0) WHERE id = OLD.contract_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Transitioned out of pending (got verified or rejected): decrement.
    IF (OLD.verified = FALSE AND OLD.rejected_at IS NULL)
       AND (NEW.verified = TRUE OR NEW.rejected_at IS NOT NULL) THEN
      UPDATE contracts SET pending_count = GREATEST(pending_count - 1, 0) WHERE id = OLD.contract_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_completions_pending_count
AFTER INSERT OR UPDATE OR DELETE ON completions
FOR EACH ROW EXECUTE FUNCTION sync_contract_pending_count();

-- is_admin() — SECURITY DEFINER so RLS on `users` doesn't recurse.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;


-- =============================================================================
-- 5. Atomic RPCs (the only safe way to mutate wallet/contract counters)
-- =============================================================================

-- Verify a worker's completion: credit wallet, write transaction, bump contract.
-- Idempotent: re-running on an already-verified completion is a no-op.
-- Auto-completes the contract when verified_count hits target_subscribers.
CREATE OR REPLACE FUNCTION verify_completion(p_completion_id UUID, p_admin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion completions%ROWTYPE;
  v_new_balance DECIMAL(12, 2);
  v_target INTEGER;
  v_verified_count INTEGER;
  v_contract_completed BOOLEAN := FALSE;
BEGIN
  -- Admin gate
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'verify_completion: caller is not an admin';
  END IF;

  -- Lock the completion row for the duration of this transaction
  SELECT * INTO v_completion
  FROM completions
  WHERE id = p_completion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'verify_completion: completion % not found', p_completion_id;
  END IF;

  -- Idempotency
  IF v_completion.verified THEN
    RETURN json_build_object('already_verified', TRUE, 'completion_id', p_completion_id);
  END IF;

  -- Credit wallet atomically (RETURNING wallet_balance avoids race)
  UPDATE users
  SET wallet_balance = wallet_balance + v_completion.payout_amount
  WHERE id = v_completion.worker_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Mark verified
  UPDATE completions
  SET verified = TRUE,
      verified_at = NOW(),
      verified_by = p_admin_id
  WHERE id = p_completion_id;

  -- Ledger entry
  INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (v_completion.worker_id, 'task_completion', v_completion.payout_amount,
          v_new_balance, p_completion_id, 'Task completion payout');

  -- Bump contract counters
  UPDATE contracts
  SET verified_count = verified_count + 1
  WHERE id = v_completion.contract_id
  RETURNING verified_count, target_subscribers INTO v_verified_count, v_target;

  -- Auto-complete the contract if target reached
  IF v_verified_count >= v_target THEN
    UPDATE contracts
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_completion.contract_id
      AND status = 'active';
    v_contract_completed := TRUE;
  END IF;

  RETURN json_build_object(
    'completion_id', p_completion_id,
    'worker_id', v_completion.worker_id,
    'payout_amount', v_completion.payout_amount,
    'new_balance', v_new_balance,
    'contract_id', v_completion.contract_id,
    'verified_count', v_verified_count,
    'target', v_target,
    'contract_completed', v_contract_completed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION verify_completion(UUID, UUID) TO authenticated;


-- Reject a completion: stamp it with a reason but DON'T credit.
-- Worker can be notified to dispute. Kept separate from DELETE so we
-- have an audit trail of fraudulent attempts.
CREATE OR REPLACE FUNCTION reject_completion(p_completion_id UUID, p_admin_id UUID, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'reject_completion: caller is not an admin';
  END IF;

  UPDATE completions
  SET rejected_at = NOW(),
      rejection_reason = p_reason,
      verified_by = p_admin_id
  WHERE id = p_completion_id
    AND verified = FALSE
    AND rejected_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reject_completion: % not found, or already verified/rejected', p_completion_id;
  END IF;

  RETURN json_build_object('completion_id', p_completion_id, 'rejected', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION reject_completion(UUID, UUID, TEXT) TO authenticated;


-- Mark a withdrawal paid: debit wallet, log transaction.
-- Idempotent.
CREATE OR REPLACE FUNCTION mark_withdrawal_paid(p_withdrawal_id UUID, p_admin_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals%ROWTYPE;
  v_new_balance DECIMAL(12, 2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'mark_withdrawal_paid: caller is not an admin';
  END IF;

  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mark_withdrawal_paid: % not found', p_withdrawal_id;
  END IF;

  IF v_withdrawal.status = 'paid' THEN
    RETURN json_build_object('already_paid', TRUE, 'withdrawal_id', p_withdrawal_id);
  END IF;

  -- Debit wallet (CHECK constraint enforces non-negative)
  UPDATE users
  SET wallet_balance = wallet_balance - v_withdrawal.amount
  WHERE id = v_withdrawal.worker_id
  RETURNING wallet_balance INTO v_new_balance;

  UPDATE withdrawals
  SET status = 'paid',
      processed_at = NOW(),
      processed_by = p_admin_id,
      admin_notes = COALESCE(p_notes, admin_notes)
  WHERE id = p_withdrawal_id;

  INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (v_withdrawal.worker_id, 'withdrawal', -v_withdrawal.amount,
          v_new_balance, p_withdrawal_id,
          'Withdrawal to ' || v_withdrawal.bank_name);

  RETURN json_build_object(
    'withdrawal_id', p_withdrawal_id,
    'worker_id', v_withdrawal.worker_id,
    'amount', v_withdrawal.amount,
    'new_balance', v_new_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION mark_withdrawal_paid(UUID, UUID, TEXT) TO authenticated;


-- =============================================================================
-- 6. RLS
-- =============================================================================

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select_self ON users
  FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY users_update_self ON users
  FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY users_insert_self ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- contracts
CREATE POLICY contracts_select ON contracts
  FOR SELECT USING (
    client_id = auth.uid()
    OR is_admin()
    OR (status = 'active' AND EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'worker'))
  );
CREATE POLICY contracts_insert_client ON contracts
  FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY contracts_update_admin ON contracts
  FOR UPDATE USING (is_admin() OR client_id = auth.uid());
CREATE POLICY contracts_delete_admin ON contracts
  FOR DELETE USING (is_admin());

-- completions
CREATE POLICY completions_select ON completions
  FOR SELECT USING (
    worker_id = auth.uid()
    OR is_admin()
    OR EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_id AND c.client_id = auth.uid())
  );
CREATE POLICY completions_insert_worker ON completions
  FOR INSERT WITH CHECK (
    worker_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'worker')
  );
CREATE POLICY completions_update_worker_submit ON completions
  FOR UPDATE USING (
    worker_id = auth.uid() OR is_admin()
  );

-- withdrawals
CREATE POLICY withdrawals_select ON withdrawals
  FOR SELECT USING (worker_id = auth.uid() OR is_admin());
CREATE POLICY withdrawals_insert_worker ON withdrawals
  FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY withdrawals_update_admin ON withdrawals
  FOR UPDATE USING (is_admin());

-- transactions: read-only for everyone in app code (writes happen inside RPCs as SECURITY DEFINER)
CREATE POLICY transactions_select ON transactions
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- messages: client owns their contract's thread; admins see/post all.
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id AND c.client_id = auth.uid()
    )
  );
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM contracts c
        WHERE c.id = contract_id AND c.client_id = auth.uid()
      )
    )
  );
CREATE POLICY messages_update_read ON messages
  FOR UPDATE USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id AND c.client_id = auth.uid()
    )
  );


-- =============================================================================
-- 7. Realtime
-- =============================================================================

-- Ensure publication exists, then add tables (idempotent guards).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE contracts, completions, withdrawals, messages, users;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
    ALTER PUBLICATION supabase_realtime ADD TABLE completions;
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- Done.
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'schema.sql applied. Next step: run seed.sql to bootstrap an admin.';
END $$;
