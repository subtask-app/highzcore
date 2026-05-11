-- =============================================
-- CREATE: Completions Table for Worker Task Claims (FIXED)
-- =============================================
-- This fixes the "column contract_id does not exist" error
-- Run this in your Supabase SQL Editor

-- =============================================
-- STEP 1: Drop existing completions table if it exists
-- =============================================
DROP TABLE IF EXISTS completions CASCADE;

-- =============================================
-- STEP 2: Create fresh completions table
-- =============================================
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  payout_amount DECIMAL(10, 2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  screenshot_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: Add foreign key constraints
-- =============================================
ALTER TABLE completions
  ADD CONSTRAINT completions_contract_id_fkey
  FOREIGN KEY (contract_id)
  REFERENCES contracts(id)
  ON DELETE CASCADE;

ALTER TABLE completions
  ADD CONSTRAINT completions_worker_id_fkey
  FOREIGN KEY (worker_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE completions
  ADD CONSTRAINT completions_verified_by_fkey
  FOREIGN KEY (verified_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- =============================================
-- STEP 4: Create indexes for faster queries
-- =============================================
CREATE INDEX idx_completions_worker_id ON completions(worker_id);
CREATE INDEX idx_completions_contract_id ON completions(contract_id);
CREATE INDEX idx_completions_verified ON completions(verified);

-- =============================================
-- STEP 5: Add unique constraint (prevent duplicate claims)
-- =============================================
CREATE UNIQUE INDEX idx_completions_unique_worker_contract
  ON completions(worker_id, contract_id);

-- =============================================
-- STEP 6: Enable RLS
-- =============================================
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 7: Create RLS Policies
-- =============================================

-- Workers can view their own completions, admins can view all
CREATE POLICY "Workers can view own completions"
  ON completions FOR SELECT
  USING (
    worker_id = auth.uid()
    OR is_admin()
  );

-- Workers can insert their own completions (claim tasks)
CREATE POLICY "Workers can insert own completions"
  ON completions FOR INSERT
  WITH CHECK (
    worker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'worker'
    )
  );

-- Admins can update completions (verify them)
CREATE POLICY "Admins can update completions"
  ON completions FOR UPDATE
  USING (is_admin());

-- Admins can delete completions if needed
CREATE POLICY "Admins can delete completions"
  ON completions FOR DELETE
  USING (is_admin());

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ SUCCESS! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Completions table created successfully!';
  RAISE NOTICE '✅ Workers can now claim and complete tasks!';
  RAISE NOTICE '✅ Admins can verify completions and pay workers!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)';
  RAISE NOTICE '2. Login as a worker';
  RAISE NOTICE '3. Try claiming a task from Available Tasks';
  RAISE NOTICE '';
END $$;
