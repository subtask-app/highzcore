-- =============================================================================
-- Migration 0002 — Worker self-verification + retry tracking
-- =============================================================================
-- Apply AFTER schema.sql and 0001_email_queue.sql.
--
-- Adds:
--   * completions.verification_attempts — tracks how many times a worker has
--     tried to verify a single task. Useful for rate-limiting abuse later.
--   * self_verify_completion() — atomic worker-side verify-and-credit RPC.
--     Mirrors verify_completion() but the caller is the worker themselves;
--     verified_by stays NULL to distinguish from admin verifications.
-- =============================================================================

-- 1. Track retry attempts
-- ---------------------------------------------------------------------------
ALTER TABLE completions
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0;

-- 2. Worker self-verify RPC
-- ---------------------------------------------------------------------------
-- Caller MUST be the worker who owns the completion (RLS would normally
-- enforce this, but the function bypasses it for the wallet write, so we
-- gate on auth.uid() == worker_id inside).

DROP FUNCTION IF EXISTS self_verify_completion(uuid);

CREATE OR REPLACE FUNCTION self_verify_completion(p_completion_id UUID)
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
  v_caller UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'self_verify_completion: caller is not authenticated';
  END IF;

  -- Lock the completion row
  SELECT * INTO v_completion
  FROM completions
  WHERE id = p_completion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'self_verify_completion: completion % not found', p_completion_id;
  END IF;

  -- Authorization: the caller must own the row.
  IF v_completion.worker_id <> v_caller THEN
    RAISE EXCEPTION 'self_verify_completion: not your completion';
  END IF;

  -- Idempotency: if already verified, no-op.
  IF v_completion.verified THEN
    RETURN json_build_object('already_verified', TRUE, 'completion_id', p_completion_id);
  END IF;

  -- Credit wallet
  UPDATE users
  SET wallet_balance = wallet_balance + v_completion.payout_amount
  WHERE id = v_completion.worker_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Mark verified (verified_by stays NULL — self-verified path)
  UPDATE completions
  SET verified = TRUE,
      verified_at = NOW(),
      submitted_at = COALESCE(submitted_at, NOW())
  WHERE id = p_completion_id;

  -- Ledger entry
  INSERT INTO transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (v_completion.worker_id, 'task_completion', v_completion.payout_amount,
          v_new_balance, p_completion_id, 'Task completion payout (self-verified)');

  -- Bump contract verified count
  UPDATE contracts
  SET verified_count = verified_count + 1
  WHERE id = v_completion.contract_id
  RETURNING verified_count, target_subscribers INTO v_verified_count, v_target;

  -- Auto-complete the contract when the target is reached
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

GRANT EXECUTE ON FUNCTION self_verify_completion(UUID) TO authenticated;

DO $$ BEGIN
  RAISE NOTICE 'migration 0002_worker_task_flow applied.';
END $$;
