-- =============================================================================
-- wipe.sql — Full data + user reset for the new (M1) schema
-- =============================================================================
-- Clears every row from every public table this app owns AND every Supabase
-- Auth user. Schema, types, functions, RLS, triggers all survive.
--
-- Paste into the Supabase SQL editor and run.
--
-- After it finishes you have an empty database. To use the app again:
--   1. Open the app (mini app or web) and sign up fresh.
--   2. Run seed.sql to promote yourself to admin.
-- =============================================================================

-- 1. Truncate every app table. CASCADE clears FK-dependent rows in order;
--    RESTART IDENTITY resets sequences.
TRUNCATE
  audit_log,
  support_messages,
  notifications,
  ledger_entries,
  withdrawals,
  payment_intents,
  task_disputes,
  tasks,
  boost_orders,
  collab_matches,
  promote_campaigns,
  abtest_tests,
  insights_studies,
  projects,
  worker_audiences,
  worker_profiles,
  creator_profiles,
  users
RESTART IDENTITY CASCADE;

-- 2. Clear Supabase Auth. `public.users.id` is FK'd to auth.users(id) ON
--    DELETE CASCADE — we already truncated public.users; this empties the
--    auth side and cascades through auth.identities / auth.sessions /
--    auth.refresh_tokens.
DELETE FROM auth.users;

-- 3. Sanity check — every count below should be 0.
SELECT
  (SELECT count(*) FROM users)             AS users,
  (SELECT count(*) FROM auth.users)        AS auth_users,
  (SELECT count(*) FROM creator_profiles)  AS creator_profiles,
  (SELECT count(*) FROM worker_profiles)   AS worker_profiles,
  (SELECT count(*) FROM worker_audiences)  AS worker_audiences,
  (SELECT count(*) FROM projects)          AS projects,
  (SELECT count(*) FROM tasks)             AS tasks,
  (SELECT count(*) FROM payment_intents)   AS payment_intents,
  (SELECT count(*) FROM withdrawals)       AS withdrawals,
  (SELECT count(*) FROM ledger_entries)    AS ledger_entries,
  (SELECT count(*) FROM notifications)     AS notifications,
  (SELECT count(*) FROM support_messages)  AS support_messages,
  (SELECT count(*) FROM audit_log)         AS audit_log;
