-- =============================================================================
-- Migration 0004 — Notification channels (email + telegram)
-- =============================================================================
-- Apply AFTER 0003.
--
-- Extends pending_emails with a `channel` column so the same queue routes
-- either email OR telegram messages. A helper `pick_channel()` picks
-- 'telegram' when the recipient has a linked Telegram account, else 'email'.
-- All 5 triggers from migration 0001 are rewritten to use it.
--
-- The table name stays `pending_emails` for backwards compatibility — it now
-- semantically means "pending notifications" but renaming would break any
-- consumers still reading the old name (e.g. RLS policies, ad-hoc queries).
-- =============================================================================

-- 1. Channel column on the queue
-- ---------------------------------------------------------------------------
ALTER TABLE pending_emails
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email', 'telegram'));

CREATE INDEX IF NOT EXISTS idx_pending_emails_channel_ready
  ON pending_emails(channel, scheduled_for)
  WHERE sent_at IS NULL AND failed_at IS NULL;

-- 2. Channel picker
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pick_channel(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_user_id IS NULL THEN 'email'
    WHEN EXISTS (
      SELECT 1 FROM users
      WHERE id = p_user_id
        AND telegram_user_id IS NOT NULL
        AND telegram_linked_at IS NOT NULL
    ) THEN 'telegram'
    ELSE 'email'
  END;
$$;

-- 3. Updated enqueue helper
-- ---------------------------------------------------------------------------
-- Accepts an explicit channel. Falls back to 'email' to stay
-- backward-compatible with anything still calling the old signature.

CREATE OR REPLACE FUNCTION enqueue_email(
  p_template        email_template_type,
  p_recipient_email TEXT,
  p_recipient_id    UUID,
  p_payload         JSONB,
  p_dedupe_key      TEXT DEFAULT NULL,
  p_scheduled_for   TIMESTAMPTZ DEFAULT NOW(),
  p_channel         TEXT DEFAULT 'email'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO pending_emails (template, recipient_email, recipient_user_id, payload, dedupe_key, scheduled_for, channel)
  VALUES (p_template, p_recipient_email, p_recipient_id, COALESCE(p_payload, '{}'::jsonb), p_dedupe_key, p_scheduled_for, p_channel)
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 4. Rewritten triggers — pick channel per recipient
-- ---------------------------------------------------------------------------

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
      'invoice:' || NEW.id::text || ':' || admin_row.id::text,
      NOW(),
      pick_channel(admin_row.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- (b) Contract activated → broadcast a "new task" to every worker.
--     Each worker gets their preferred channel: telegram if linked, email
--     otherwise. This is the headline notification — workers see the new
--     campaign in seconds instead of next-time-they-check-email.
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
        'broadcast:' || NEW.id::text || ':' || worker_row.id::text,
        NOW(),
        pick_channel(worker_row.id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- (c) Contract completed → email/ping the client.
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
      'complete:' || NEW.id::text,
      NOW(),
      pick_channel(client_row.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- (d/e) Completion verified or rejected → notify the worker.
CREATE OR REPLACE FUNCTION on_completion_state_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  worker_row users%ROWTYPE;
  contract_row contracts%ROWTYPE;
  v_channel TEXT;
BEGIN
  IF NEW.verified = TRUE AND (OLD.verified IS DISTINCT FROM TRUE) THEN
    SELECT * INTO worker_row FROM users WHERE id = NEW.worker_id;
    SELECT * INTO contract_row FROM contracts WHERE id = NEW.contract_id;
    v_channel := pick_channel(worker_row.id);
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
      'verified:' || NEW.id::text,
      NOW(),
      v_channel
    );
  END IF;

  IF NEW.rejected_at IS NOT NULL AND (OLD.rejected_at IS NULL) THEN
    SELECT * INTO worker_row FROM users WHERE id = NEW.worker_id;
    SELECT * INTO contract_row FROM contracts WHERE id = NEW.contract_id;
    v_channel := pick_channel(worker_row.id);
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
      'rejected:' || NEW.id::text,
      NOW(),
      v_channel
    );
  END IF;

  RETURN NEW;
END;
$$;

-- (f) Admin sends a message → immediate ping to the client.
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
      'admin_msg:' || NEW.id::text,
      NOW(),
      pick_channel(client_row.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  RAISE NOTICE 'migration 0004_notification_channels applied. Triggers now route via pick_channel().';
END $$;
