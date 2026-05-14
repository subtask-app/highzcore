-- =============================================================================
-- Migration 0003 — Telegram foundation
-- =============================================================================
-- Apply AFTER 0002.
--
-- Adds Telegram identity columns so a user can sign in via the Mini App
-- (Telegram WebApp) and so the bot can DM them notifications.
--
-- The link is many-to-one: one Highzcore user, one Telegram account.
-- We don't drop the email+password path — users can have either or both.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_user_id   BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username  TEXT,
  ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- Unique only when set, so unlinked users don't collide on NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_user_id
  ON users(telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

DO $$ BEGIN
  RAISE NOTICE 'migration 0003_telegram_foundation applied.';
END $$;