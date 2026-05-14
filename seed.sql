-- =============================================================================
-- Highzcore — Seed
-- =============================================================================
-- Run AFTER schema.sql to promote a real auth.users row to admin.
-- Replace the email below with yours, then run.
-- =============================================================================

UPDATE users
SET role = 'admin'
WHERE email = 'YOUR-ADMIN-EMAIL@example.com';

-- Sanity check
SELECT id, email, role FROM users WHERE role = 'admin';
