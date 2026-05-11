-- =============================================
-- FIX: Infinite Recursion in RLS Policies
-- =============================================
-- This fixes the "infinite recursion detected in policy for relation 'users'" error
-- Run this in your Supabase SQL Editor IMMEDIATELY

-- =============================================
-- STEP 1: Drop ALL existing policies on users table
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Drop any other policies that might exist
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'users'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
  END LOOP;
END $$;

-- =============================================
-- STEP 2: Create SIMPLE, NON-RECURSIVE policies
-- =============================================

-- ✅ Allow users to read their OWN profile (no recursion!)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- ✅ Allow users to update their OWN profile (no recursion!)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ✅ Allow authenticated users to INSERT (for signup)
CREATE POLICY "Allow authenticated insert"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 3: Create ADMIN helper function (no recursion!)
-- =============================================

-- Create a function that checks if current user is admin
-- This uses auth.uid() directly, avoiding recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make the function accessible
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- =============================================
-- STEP 4: Add admin policies using the function
-- =============================================

-- Admin can view ALL users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() = id  -- Can always see own profile
    OR is_admin()    -- OR if they're an admin
  );

-- Admin can update ALL users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    auth.uid() = id  -- Can always update own profile
    OR is_admin()    -- OR if they're an admin
  );

-- =============================================
-- STEP 5: Fix other tables (contracts, messages, etc.)
-- =============================================

-- CONTRACTS TABLE - Drop all existing policies first
DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can update all contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can delete contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contracts;
DROP POLICY IF EXISTS "Enable read access for own contracts" ON contracts;

-- Drop any other contract policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'contracts'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON contracts';
  END LOOP;
END $$;

CREATE POLICY "Admins can view all contracts"
  ON contracts FOR SELECT
  USING (
    client_id = auth.uid()  -- Clients can see their own
    OR is_admin()           -- Admins can see all
    OR (                    -- Workers can see active contracts (available tasks)
      status = 'active' AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'worker'
      )
    )
  );

CREATE POLICY "Admins can update all contracts"
  ON contracts FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete contracts"
  ON contracts FOR DELETE
  USING (is_admin());

CREATE POLICY "Clients can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- MESSAGES TABLE - Drop all existing policies first
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON messages;
DROP POLICY IF EXISTS "Clients can view own messages" ON messages;
DROP POLICY IF EXISTS "Clients can insert messages" ON messages;
DROP POLICY IF EXISTS "Enable read access for own messages" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;

-- Drop any other message policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'messages'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON messages';
  END LOOP;
END $$;

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid()  -- Can see own messages
    OR is_admin()           -- Admins can see all
    OR EXISTS (             -- Contract owner can see messages
      SELECT 1 FROM contracts
      WHERE contracts.id = messages.contract_id
      AND contracts.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()  -- Must be own message
    AND (
      is_admin()            -- Admins can message anyone
      OR EXISTS (           -- OR client messaging their own contract
        SELECT 1 FROM contracts
        WHERE contracts.id = contract_id
        AND contracts.client_id = auth.uid()
      )
    )
  );

-- WITHDRAWALS TABLE - Drop all existing policies first
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Workers can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Workers can insert withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Enable read access for own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON withdrawals;

-- Drop any other withdrawal policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'withdrawals'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON withdrawals';
  END LOOP;
END $$;

CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  USING (
    worker_id = auth.uid()  -- Workers see own withdrawals
    OR is_admin()           -- Admins see all
  );

CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (is_admin());

CREATE POLICY "Workers can insert withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (worker_id = auth.uid());

-- TRANSACTIONS TABLE (if exists) - Drop all existing policies first
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    -- Drop all existing transaction policies
    DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
    DROP POLICY IF EXISTS "Enable read access for own transactions" ON transactions;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;

    -- Drop any other transaction policies
    FOR policy_record IN
      SELECT policyname FROM pg_policies WHERE tablename = 'transactions'
    LOOP
      EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON transactions';
    END LOOP;

    -- Create new policy
    CREATE POLICY "Admins can view all transactions"
      ON transactions FOR SELECT
      USING (
        user_id = auth.uid()  -- Users see own transactions
        OR is_admin()         -- Admins see all
      );
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check the new policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'contracts', 'messages', 'withdrawals', 'transactions')
ORDER BY tablename, policyname;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed successfully!';
  RAISE NOTICE '✅ Infinite recursion issue resolved!';
  RAISE NOTICE '✅ Admin policies updated!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Log out of your app';
  RAISE NOTICE '2. Clear browser cookies (or use incognito)';
  RAISE NOTICE '3. Log back in';
  RAISE NOTICE '4. Try accessing /dashboard/admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Your admin email: valiantjoee@gmail.com';
END $$;
