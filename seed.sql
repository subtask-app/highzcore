-- =============================================================================
-- seed.sql — Promote a user to admin
-- =============================================================================
-- Run AFTER you've signed up fresh in the app. Promotes ONE user to admin.
--
-- Telegram signups get a synthetic email (tg_<id>@telegram.highzcore.tech),
-- so picking by email isn't always obvious — STEP 1 lists everyone so you
-- can see what to target.
-- =============================================================================

-- STEP 1 — see who exists. Run this first, find your row.
SELECT id, email, full_name, role, telegram_username, telegram_user_id, created_at
FROM users
ORDER BY created_at ASC;

-- STEP 2 — promote yourself. Uncomment ONE of these and fill it in:

-- (a) By email — works for Google signups, or paste the synthetic tg_ email:
-- UPDATE users SET role = 'admin' WHERE email = 'paste-your-email-here';

-- (b) By Telegram username — easiest for Telegram signups:
-- UPDATE users SET role = 'admin' WHERE telegram_username = 'your_tg_username';

-- (c) By id — copy the id from STEP 1's output:
-- UPDATE users SET role = 'admin' WHERE id = 'paste-uuid-here';

-- STEP 3 — confirm. Should show your row with role = 'admin'.
SELECT id, email, full_name, role FROM users WHERE role = 'admin';
