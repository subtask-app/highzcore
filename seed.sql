-- =============================================================================
-- seed.sql — Promote a user to admin (new M1 schema)
-- =============================================================================
-- Run AFTER you've signed up fresh in the app. Promotes ONE user to admin.
--
-- The new schema uses role booleans (is_creator / is_worker / is_admin) so
-- a user can hold any combination of roles. This script flips is_admin = TRUE
-- on the user you target.
--
-- Telegram signups get a synthetic email (tg_<id>@telegram.highzcore.tech),
-- so picking by email isn't always obvious — STEP 1 lists everyone so you
-- can see what to target.
-- =============================================================================

-- STEP 1 — see who exists. Run this first, find your row.
SELECT
  id, email, full_name,
  is_admin, is_creator, is_worker,
  country, preferred_locale,
  telegram_username, telegram_user_id,
  created_at
FROM users
ORDER BY created_at ASC;

-- STEP 2 — promote yourself. Uncomment ONE of these and fill it in:

-- (a) By email — works for any signup; for Telegram, paste the synthetic tg_ email:
-- UPDATE users SET is_admin = TRUE WHERE email = 'paste-your-email-here';

-- (b) By Telegram username — easiest for Telegram signups:
-- UPDATE users SET is_admin = TRUE WHERE telegram_username = 'your_tg_username';

-- (c) By id — copy the id from STEP 1's output:
-- UPDATE users SET is_admin = TRUE WHERE id = 'paste-uuid-here';

-- STEP 3 — confirm. Should show your row with is_admin = true.
SELECT id, email, full_name, is_admin, is_creator, is_worker
FROM users WHERE is_admin;
