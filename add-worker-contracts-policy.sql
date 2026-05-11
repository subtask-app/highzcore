-- =============================================
-- Add RLS Policy for Workers to View Active Contracts
-- =============================================
-- This allows workers to see active contracts as available tasks
-- Run this in your Supabase SQL Editor

-- Allow workers to view ACTIVE contracts (these are the available tasks)
CREATE POLICY "Workers can view active contracts"
  ON contracts FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'worker'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Workers can now view active contracts as available tasks!';
END $$;
