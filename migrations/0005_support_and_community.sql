-- =============================================================================
-- Migration 0005 — Live support + community channel
-- =============================================================================
-- Apply AFTER 0004.
--
-- Adds:
--   * support_messages table — every user↔admin support DM is logged here.
--   * 'telegram_channel' added to the channel CHECK so the drain endpoint can
--     route a single "broadcast to community" row instead of per-user fanout.
--   * 'community_announcement' template enum + trigger fan-out so every
--     contract activation ALSO posts once to the public Telegram channel.
-- =============================================================================

-- 1. Support thread log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id  BIGINT NOT NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('user_to_admin', 'admin_to_user')),
  text              TEXT NOT NULL,
  -- Telegram message ids that let us thread replies. When the admin replies
  -- in the admin group to a message we sent there, we look it up by
  -- admin_message_id and find the original user_telegram_id.
  user_message_id   BIGINT,
  admin_message_id  BIGINT,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_tg
  ON support_messages(user_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_admin_msg
  ON support_messages(admin_message_id)
  WHERE admin_message_id IS NOT NULL;

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_messages_admin_select ON support_messages;
CREATE POLICY support_messages_admin_select ON support_messages
  FOR SELECT USING (is_admin());

-- 2. New channel value: 'telegram_channel' for one-shot broadcasts
-- ---------------------------------------------------------------------------
ALTER TABLE pending_emails DROP CONSTRAINT IF EXISTS pending_emails_channel_check;
ALTER TABLE pending_emails ADD CONSTRAINT pending_emails_channel_check
  CHECK (channel IN ('email', 'telegram', 'telegram_channel'));

-- 3. New template value: 'community_announcement'
-- ---------------------------------------------------------------------------
ALTER TYPE email_template_type ADD VALUE IF NOT EXISTS 'community_announcement';

-- 4. Trigger: contract activation → also fan out ONE community announcement
-- ---------------------------------------------------------------------------
-- This runs in addition to the per-worker broadcast already wired in 0004.
-- The dedupe_key ensures we never double-post the same contract.

CREATE OR REPLACE FUNCTION on_contract_activated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  worker_row RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN
    -- 4a. Per-worker DMs (existing behaviour from 0004)
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

    -- 4b. Single post to the community channel
    PERFORM enqueue_email(
      'community_announcement',
      '__community_channel__',     -- sentinel, never used as an email address
      NULL,                         -- channel posts have no per-user recipient
      jsonb_build_object(
        'contract_id', NEW.id,
        'channel_name', NEW.channel_name,
        'channel_url', NEW.channel_url,
        'target_subscribers', NEW.target_subscribers,
        'payout', NEW.worker_payout_per_task
      ),
      'community:' || NEW.id::text,
      NOW(),
      'telegram_channel'
    );
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  RAISE NOTICE 'migration 0005 applied. Support log + community channel ready.';
END $$;
