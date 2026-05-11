-- =============================================
-- SubTask.ng - Complete Database Setup
-- =============================================
-- Run this entire file in your Supabase SQL Editor
-- This will set up everything you need for the app
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: CREATE ENUMS
-- =============================================

-- User role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'worker', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Withdrawal status enum
DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Contract status enum
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('pending_payment', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- STEP 2: CREATE TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  google_token TEXT, -- Encrypted OAuth token for YouTube API (workers only)
  google_id TEXT, -- Google account ID
  full_name TEXT,
  avatar_url TEXT,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00, -- Workers only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table (client campaign orders)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_image TEXT,
  target_subscribers INTEGER NOT NULL,
  current_subscribers INTEGER DEFAULT 0,
  price_per_subscriber DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status contract_status DEFAULT 'pending_payment',
  completed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_target_subs CHECK (target_subscribers > 0),
  CONSTRAINT positive_price CHECK (price_per_subscriber > 0)
);

-- Tasks table (subscription orders from clients)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL, -- YouTube Channel ID
  channel_url TEXT NOT NULL, -- YouTube channel URL
  channel_name TEXT, -- Channel display name
  channel_thumbnail TEXT, -- Channel thumbnail URL
  target_count INTEGER NOT NULL, -- Number of subscribers needed
  completed_count INTEGER DEFAULT 0, -- Number verified so far
  status task_status DEFAULT 'active',
  amount_paid DECIMAL(10, 2) NOT NULL, -- Total amount client paid
  worker_payout_per_task DECIMAL(10, 2) DEFAULT 120.00, -- Amount per subscription
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_proof_url TEXT, -- Screenshot of payment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-set when target is reached
  CONSTRAINT positive_target CHECK (target_count > 0),
  CONSTRAINT positive_amount CHECK (amount_paid > 0)
);

-- Task completions table (tracks which workers completed which tasks)
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE, -- True if YouTube API confirmed subscription
  payout_amount DECIMAL(10, 2) DEFAULT 120.00, -- Amount credited
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  reverted BOOLEAN DEFAULT FALSE, -- True if worker unsubscribed later
  reverted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(task_id, worker_id) -- A worker can only complete a task once
);

-- Withdrawals table (worker payout requests)
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id), -- Admin who processed it
  admin_notes TEXT,
  CONSTRAINT positive_withdrawal CHECK (amount >= 1000.00) -- Minimum ₦1,000
);

-- Transactions log (audit trail for all money movements)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'deposit', 'task_completion', 'withdrawal', 'refund', 'reversal'
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2), -- Wallet balance after this transaction
  reference_id UUID, -- References task_id, completion_id, or withdrawal_id
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (contract-based messaging between clients and admin)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Each message thread is tied to a task/order
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE, -- Or tied to a contract
  sender_id UUID NOT NULL,
  sender_role user_role, -- 'client' or 'admin'
  message TEXT NOT NULL,
  is_payment_proof BOOLEAN DEFAULT FALSE, -- True if this message includes payment proof
  payment_proof_url TEXT, -- URL to uploaded payment screenshot
  is_read BOOLEAN DEFAULT FALSE,
  is_from_client BOOLEAN DEFAULT FALSE, -- For contract messaging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_reference CHECK (task_id IS NOT NULL OR contract_id IS NOT NULL)
);

-- =============================================
-- STEP 3: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_completions_task_id ON completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_worker_id ON completions(worker_id);
CREATE INDEX IF NOT EXISTS idx_completions_verified ON completions(verified);
CREATE INDEX IF NOT EXISTS idx_withdrawals_worker_id ON withdrawals(worker_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_contract_id ON messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =============================================
-- STEP 4: CREATE TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update task completion count
CREATE OR REPLACE FUNCTION increment_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified = TRUE AND (OLD IS NULL OR OLD.verified = FALSE) THEN
    UPDATE tasks
    SET completed_count = completed_count + 1
    WHERE id = NEW.task_id;

    -- Check if target reached and mark as completed
    UPDATE tasks
    SET status = 'completed', expires_at = NOW()
    WHERE id = NEW.task_id
    AND completed_count >= target_count
    AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_completion_trigger ON completions;
CREATE TRIGGER task_completion_trigger
  AFTER INSERT OR UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION increment_task_completion();

-- Function to update worker wallet balance
CREATE OR REPLACE FUNCTION update_worker_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified = TRUE AND (OLD IS NULL OR OLD.verified = FALSE) THEN
    UPDATE users
    SET wallet_balance = wallet_balance + NEW.payout_amount
    WHERE id = NEW.worker_id AND role = 'worker';

    -- Log transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    SELECT
      NEW.worker_id,
      'task_completion',
      NEW.payout_amount,
      NEW.id,
      'Task completion payment'
    FROM users
    WHERE id = NEW.worker_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS worker_wallet_trigger ON completions;
CREATE TRIGGER worker_wallet_trigger
  AFTER INSERT OR UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_wallet();

-- Function to handle withdrawal approval
CREATE OR REPLACE FUNCTION process_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Deduct from worker wallet
    UPDATE users
    SET wallet_balance = wallet_balance - NEW.amount
    WHERE id = NEW.worker_id;

    -- Log transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (
      NEW.worker_id,
      'withdrawal',
      -NEW.amount,
      NEW.id,
      'Withdrawal to ' || NEW.bank_name
    );

    NEW.processed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_process_trigger ON withdrawals;
CREATE TRIGGER withdrawal_process_trigger
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION process_withdrawal();

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================

-- USERS POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- CONTRACTS POLICIES
DROP POLICY IF EXISTS "Clients can view own contracts" ON contracts;
CREATE POLICY "Clients can view own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can insert contracts" ON contracts;
CREATE POLICY "Clients can insert contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update own contracts" ON contracts;
CREATE POLICY "Clients can update own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
CREATE POLICY "Admins can view all contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all contracts" ON contracts;
CREATE POLICY "Admins can update all contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- TASKS POLICIES
DROP POLICY IF EXISTS "Active tasks visible to workers" ON tasks;
CREATE POLICY "Active tasks visible to workers"
  ON tasks FOR SELECT
  USING (status = 'active' AND payment_confirmed = TRUE);

DROP POLICY IF EXISTS "Clients can view own tasks" ON tasks;
CREATE POLICY "Clients can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can insert tasks" ON tasks;
CREATE POLICY "Clients can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- COMPLETIONS POLICIES
DROP POLICY IF EXISTS "Workers can view own completions" ON completions;
CREATE POLICY "Workers can view own completions"
  ON completions FOR SELECT
  USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "Workers can insert completions" ON completions;
CREATE POLICY "Workers can insert completions"
  ON completions FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- WITHDRAWALS POLICIES
DROP POLICY IF EXISTS "Workers can view own withdrawals" ON withdrawals;
CREATE POLICY "Workers can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = worker_id);

DROP POLICY IF EXISTS "Workers can create withdrawals" ON withdrawals;
CREATE POLICY "Workers can create withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Clients can view messages for their tasks" ON messages;
CREATE POLICY "Clients can view messages for their tasks"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = messages.task_id
      AND tasks.client_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = messages.contract_id
      AND contracts.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can send messages for their tasks" ON messages;
CREATE POLICY "Clients can send messages for their tasks"
  ON messages FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = task_id
        AND tasks.client_id = auth.uid()
      )
      AND sender_id = auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM contracts
        WHERE contracts.id = contract_id
        AND contracts.client_id = auth.uid()
      )
      AND sender_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert messages" ON messages;
CREATE POLICY "Admins can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- STEP 7: ENABLE REALTIME (OPTIONAL)
-- =============================================
-- Uncomment these lines to enable realtime updates

-- ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE withdrawals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- =============================================
-- SETUP COMPLETE!
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================';
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '=============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Sign up at http://localhost:3000/for-clients';
  RAISE NOTICE '2. Make yourself admin:';
  RAISE NOTICE '   UPDATE users SET role = ''admin'' WHERE email = ''your-email@gmail.com'';';
  RAISE NOTICE '3. Enable realtime in Database → Replication';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- ✅ users';
  RAISE NOTICE '- ✅ contracts';
  RAISE NOTICE '- ✅ tasks';
  RAISE NOTICE '- ✅ completions';
  RAISE NOTICE '- ✅ withdrawals';
  RAISE NOTICE '- ✅ transactions';
  RAISE NOTICE '- ✅ messages';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies: ✅ Enabled for all tables';
  RAISE NOTICE 'Admin Access: ✅ Configured';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================';
END $$;
