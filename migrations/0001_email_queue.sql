-- =============================================================================
-- Migration 0001 — Email queue + triggers + scheduler
-- =============================================================================
-- Apply AFTER schema.sql is in place. Idempotent (safe to re-run).
--
-- After applying, configure pg_cron at the bottom of this file.
-- =============================================================================


-- 1. Email types & queue table
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE email_template_type AS ENUM (
    'new_contract_invoice',
    'task_approved_broadcast',
    'admin_no_reply_reminder',
    'client_no_reply_reminder',
    'new_admin_message',
    'task_verified',
    'task_rejected_warning',
    'campaign_completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS pending_emails (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template          email_template_type NOT NULL,
  recipient_email   TEXT NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at           TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  error             TEXT,
  attempts          INTEGER NOT NULL DEFAULT 0,
  -- Idempotency key: if non-null, only one row per key may exist.
  -- Used to coalesce duplicate enqueues (e.g. one reminder per message).
  dedupe_key        TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
` 
CREATE INDEX IF NOT EXISTS idx_pending_emails_ready
  ON pending_emails(scheduled_for)
  WHERE sent_at IS NULL AND failed_at IS NULL;

ALTER TABLE pending_emails ENABLE ROW LEVEL SECURITY;
-- Only the service role / RPCs touch this table from app code. No public access.
DROP POLICY IF EXISTS pending_emails_admin_select ON pending_emails;
CREATE POLICY pending_emails_admin_select ON pending_emails
  FOR SELECT USING (is_admin());


-- 2. Helper: enqueue
-- =============================================================================

CREATE OR REPLACE FUNCTION enqueue_email(
  p_template        email_template_type,
  p_recipient_email TEXT,
  p_recipient_id    UUID,
  p_payload         JSONB,
  p_dedupe_key      TEXT DEFAULT NULL,
  p_scheduled_for   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO pending_emails (template, recipient_email, recipient_user_id, payload, dedupe_key, scheduled_for)
  VALUES (p_template, p_recipient_email, p_recipient_id, COALESCE(p_payload, '{}'::jsonb), p_dedupe_key, p_scheduled_for)
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


-- 3. Triggers — wire app events to the queue
-- =============================================================================

-- (a) New contract → notify every admin with an invoice.
CREATE OR REPLACE FUNCTION on_contract_inserted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  admin_row RECORD;
  client_row users%ROWTYPE;
BEGIN
  SELECT * INTO client_row FROM users WHERE id = NEW.client_id;

  FOR admin_row IN SELECT id, email FROM users WHERE role = 'admin' LOOP
    PERFORM enqueue_email(
      'new_contract_invoice',
      admin_row.email,
      admin_row.id,
      jsonb_build_object(
        'contract_id', NEW.id,
        'client_email', client_row.email,
        'client_name', client_row.full_name,
        'channel_name', NEW.channel_name,
        'channel_url', NEW.channel_url,
        'target_subscribers', NEW.target_subscribers,
        'total_amount', NEW.total_amount
      ),
      'invoice:' || NEW.id::text || ':' || admin_row.id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_invoice ON contracts;
CREATE TRIGGER trg_contract_invoice
AFTER INSERT ON contracts
FOR EACH ROW EXECUTE FUNCTION on_contract_inserted();


-- (b) Contract activated → broadcast a "new task" email to every worker.
-- Note: scales O(workers). For very large worker bases, switch to a batched send.
CREATE OR REPLACE FUNCTION on_contract_activated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  worker_row RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN
    FOR worker_row IN SELECT id, email FROM users WHERE role = 'worker' LOOP
      PERFORM enqueue_email(
        'task_approved_broadcast',
        worker_row.email,
        worker_row.id,
        jsonb_build_object(
          'contract_id', NEW.id,
          'channel_name', NEW.channel_name,
          'channel_url', NEW.channel_url,
          'target_subscribers', NEW.target_subscribers,
          'verified_count', NEW.verified_count,
          'payout', NEW.worker_payout_per_task
        ),
        'broadcast:' || NEW.id::text || ':' || worker_row.id::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_activated ON contracts;
CREATE TRIGGER trg_contract_activated
AFTER UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION on_contract_activated();


-- (c) Contract completed (target reached) → email the client.
CREATE OR REPLACE FUNCTION on_contract_completed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  client_row users%ROWTYPE;
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    SELECT * INTO client_row FROM users WHERE id = NEW.client_id;
    PERFORM enqueue_email(
      'campaign_completed',
      client_row.email,
      client_row.id,
      jsonb_build_object(
        'contract_id', NEW.id,
        'channel_name', NEW.channel_name,
        'target_subscribers', NEW.target_subscribers
      ),
      'complete:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_completed ON contracts;
CREATE TRIGGER trg_contract_completed
AFTER UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION on_contract_completed();


-- (d) Completion verified → email the worker.
-- (e) Completion rejected → warm warning email to the worker.
CREATE OR REPLACE FUNCTION on_completion_state_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  worker_row users%ROWTYPE;
  contract_row contracts%ROWTYPE;
BEGIN
  -- Verified transition
  IF NEW.verified = TRUE AND (OLD.verified IS DISTINCT FROM TRUE) THEN
    SELECT * INTO worker_row FROM users WHERE id = NEW.worker_id;
    SELECT * INTO contract_row FROM contracts WHERE id = NEW.contract_id;
    PERFORM enqueue_email(
      'task_verified',
      worker_row.email,
      worker_row.id,
      jsonb_build_object(
        'completion_id', NEW.id,
        'channel_name', contract_row.channel_name,
        'channel_url', contract_row.channel_url,
        'payout_amount', NEW.payout_amount
      ),
      'verified:' || NEW.id::text
    );
  END IF;

  -- Rejected transition
  IF NEW.rejected_at IS NOT NULL AND (OLD.rejected_at IS NULL) THEN
    SELECT * INTO worker_row FROM users WHERE id = NEW.worker_id;
    SELECT * INTO contract_row FROM contracts WHERE id = NEW.contract_id;
    PERFORM enqueue_email(
      'task_rejected_warning',
      worker_row.email,
      worker_row.id,
      jsonb_build_object(
        'completion_id', NEW.id,
        'channel_name', contract_row.channel_name,
        'channel_url', contract_row.channel_url,
        'reason', COALESCE(NEW.rejection_reason, 'Subscription could not be verified')
      ),
      'rejected:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_completion_state ON completions;
CREATE TRIGGER trg_completion_state
AFTER UPDATE ON completions
FOR EACH ROW EXECUTE FUNCTION on_completion_state_change();


-- (f) Admin sends a message → immediate email to the client.
-- The reminder cron handles the other direction (client → admin) on its own schedule.
CREATE OR REPLACE FUNCTION on_message_inserted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  client_row users%ROWTYPE;
  contract_row contracts%ROWTYPE;
BEGIN
  IF NEW.sender_role = 'admin' THEN
    SELECT * INTO contract_row FROM contracts WHERE id = NEW.contract_id;
    SELECT * INTO client_row FROM users WHERE id = contract_row.client_id;
    PERFORM enqueue_email(
      'new_admin_message',
      client_row.email,
      client_row.id,
      jsonb_build_object(
        'message_id', NEW.id,
        'contract_id', NEW.contract_id,
        'channel_name', contract_row.channel_name,
        'preview', LEFT(NEW.message, 240)
      ),
      'admin_msg:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_inserted ON messages;
CREATE TRIGGER trg_message_inserted
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION on_message_inserted();


-- 4. Reminder selectors (called by /api/cron/send-reminders)
-- =============================================================================
-- Two SQL functions the API can call. Each returns rows to remind about; the
-- API enqueues the email and updates messages.reminder_sent_at to prevent
-- repeated reminders. We expose them as RPC for the service-role client.

-- Client → admin messages with no admin reply for > 2 minutes.
CREATE OR REPLACE FUNCTION stale_client_messages(p_threshold INTERVAL DEFAULT '2 minutes')
RETURNS TABLE (
  message_id    UUID,
  contract_id   UUID,
  client_email  TEXT,
  channel_name  TEXT,
  preview       TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.contract_id, u.email, c.channel_name, LEFT(m.message, 240)
  FROM messages m
  JOIN contracts c ON c.id = m.contract_id
  JOIN users u     ON u.id = c.client_id
  WHERE m.sender_role = 'client'
    AND m.reminder_sent_at IS NULL
    AND m.created_at < NOW() - p_threshold
    AND NOT EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.contract_id = m.contract_id
        AND m2.sender_role = 'admin'
        AND m2.created_at > m.created_at
    );
$$;

-- Admin → client messages with no client reply for > 10 minutes.
CREATE OR REPLACE FUNCTION stale_admin_messages(p_threshold INTERVAL DEFAULT '10 minutes')
RETURNS TABLE (
  message_id    UUID,
  contract_id   UUID,
  client_email  TEXT,
  channel_name  TEXT,
  preview       TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.contract_id, u.email, c.channel_name, LEFT(m.message, 240)
  FROM messages m
  JOIN contracts c ON c.id = m.contract_id
  JOIN users u     ON u.id = c.client_id
  WHERE m.sender_role = 'admin'
    AND m.reminder_sent_at IS NULL
    AND m.created_at < NOW() - p_threshold
    AND NOT EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.contract_id = m.contract_id
        AND m2.sender_role = 'client'
        AND m2.created_at > m.created_at
    );
$$;


-- 5. pg_cron + pg_net wiring (OPTIONAL — manual setup required)
-- =============================================================================
-- This is commented out so this file remains idempotent on Supabase instances
-- where pg_cron / pg_net aren't enabled yet. To enable scheduled email
-- processing, follow these one-time steps in the Supabase SQL editor:
--
--   1. Enable the extensions in Supabase Studio → Database → Extensions:
--        - pg_cron
--        - pg_net
--
--   2. Store the secret + endpoint in Vault or set them as parameters:
--        ALTER DATABASE postgres SET app.cron_secret      = 'your-cron-secret';
--        ALTER DATABASE postgres SET app.app_url          = 'https://your-app.example.com';
--
--   3. Schedule the two jobs (uncomment + run once):
--
-- SELECT cron.schedule(
--   'process-emails',
--   '* * * * *',  -- every minute
--   $cron$
--     SELECT net.http_post(
--       url := current_setting('app.app_url') || '/api/cron/process-emails',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'X-Cron-Secret', current_setting('app.cron_secret')
--       )
--     );
--   $cron$
-- );
--
-- SELECT cron.schedule(
--   'send-reminders',
--   '* * * * *',  -- every minute
--   $cron$
--     SELECT net.http_post(
--       url := current_setting('app.app_url') || '/api/cron/send-reminders',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'X-Cron-Secret', current_setting('app.cron_secret')
--       )
--     );
--   $cron$
-- );
--
-- To inspect jobs:        SELECT * FROM cron.job;
-- To remove a job:        SELECT cron.unschedule('process-emails');
-- To inspect runs:        SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- LOCAL DEV alternative: hit the endpoints manually:
--   curl -X POST http://localhost:3000/api/cron/process-emails -H "X-Cron-Secret: $CRON_SECRET"
--   curl -X POST http://localhost:3000/api/cron/send-reminders -H "X-Cron-Secret: $CRON_SECRET"


DO $$ BEGIN
  RAISE NOTICE 'migration 0001_email_queue applied.';
END $$;
