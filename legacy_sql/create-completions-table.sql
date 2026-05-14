-- =============================================
-- CREATE: Completions Table for Worker Task Claims
-- =============================================
-- This table tracks when workers claim and complete tasks (contracts)
-- Run this in your Supabase SQL Editor

-- Create the completions table
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE,
  payout_amount DECIMAL(10, 2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  screenshot_url TEXT, -- Proof of completion
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_completions_worker_id ON completions(worker_id);
CREATE INDEX IF NOT EXISTS idx_completions_contract_id ON completions(contract_id);
CREATE INDEX IF NOT EXISTS idx_completions_verified ON completions(verified);

-- Enable RLS
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Workers can view own completions" ON completions;
DROP POLICY IF EXISTS "Workers can insert own completions" ON completions;
DROP POLICY IF EXISTS "Admins can view all completions" ON completions;
DROP POLICY IF EXISTS "Admins can update completions" ON completions;

-- RLS Policies

-- Workers can view their own completions
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
-- Add constraint to prevent duplicate claims
-- =============================================
-- A worker can only claim the same contract once
CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_unique_worker_contract
  ON completions(worker_id, contract_id);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Completions table created successfully!';
  RAISE NOTICE '✅ Workers can now claim and complete tasks!';
  RAISE NOTICE '✅ Admins can verify completions!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update the worker dashboard code to use contract_id';
END $$;
