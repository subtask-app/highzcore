-- =============================================
-- Make User an Admin
-- =============================================
-- Run this in your Supabase SQL Editor after database-setup.sql

-- MAKE ONE USER ADMIN
-- Replace 'your-email@gmail.com' with the actual email
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';

-- =============================================
-- Additional Admin Management Queries
-- =============================================

-- MAKE MULTIPLE USERS ADMIN
-- Uncomment and modify:
-- UPDATE users
-- SET role = 'admin'
-- WHERE email IN (
--   'admin1@gmail.com',
--   'admin2@gmail.com',
--   'admin3@gmail.com'
-- );

-- CHECK WHO IS ADMIN
-- SELECT email, full_name, role, created_at
-- FROM users
-- WHERE role = 'admin'
-- ORDER BY created_at DESC;

-- REMOVE ADMIN ROLE
-- UPDATE users
-- SET role = 'client'  -- or 'worker'
-- WHERE email = 'former-admin@gmail.com';

-- =============================================
-- NOTES:
-- =============================================
-- 1. User must sign up first before you can make them admin
-- 2. After running this, user needs to log out and log back in
-- 3. Admin dashboard: http://localhost:3000/dashboard/admin
