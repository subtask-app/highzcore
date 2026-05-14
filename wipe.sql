-- =============================================================================
-- wipe.sql — Full data + user reset
-- =============================================================================
-- Clears ALL rows from every app table AND every Supabase Auth user. The
-- SCHEMA stays intact — tables, types, functions, triggers, RLS, pg_cron
-- jobs all survive. Only data is removed.
--
-- Paste the whole file into the Supabase SQL editor and run it.
--
-- After it finishes you have an empty database. To use the app again:
--   1. Open the app (mini app or web) and sign up fresh.
--   2. Run seed.sql to promote yourself to admin.
-- =============================================================================

-- 1. Truncate every app table.
--    CASCADE clears FK-dependent rows in the right order; RESTART IDENTITY
--    resets sequences. pending_emails / support_messages reference users with
--    ON DELETE SET NULL (they don't cascade-delete), so they're listed
--    explicitly to be sure they're emptied too.
TRUNCATE
  messages,
  transactions,
  withdrawals,
  completions,
  contracts,
  support_messages,
  pending_emails,
  users
RESTART IDENTITY CASCADE;

-- 2. Clear Supabase Auth.
--    public.users.id is FK'd to auth.users(id) ON DELETE CASCADE. We already
--    truncated public.users above; this clears the auth side and cascades
--    through auth.identities / auth.sessions / auth.refresh_tokens.
DELETE FROM auth.users;

-- 3. Sanity check — every count below should be 0.
SELECT
  (SELECT count(*) FROM users)            AS users,
  (SELECT count(*) FROM auth.users)       AS auth_users,
  (SELECT count(*) FROM contracts)        AS contracts,
  (SELECT count(*) FROM completions)      AS completions,
  (SELECT count(*) FROM withdrawals)      AS withdrawals,
  (SELECT count(*) FROM transactions)     AS transactions,
  (SELECT count(*) FROM messages)         AS messages,
  (SELECT count(*) FROM pending_emails)   AS pending_emails,
  (SELECT count(*) FROM support_messages) AS support_messages;
