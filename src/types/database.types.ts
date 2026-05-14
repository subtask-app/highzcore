// Hand-maintained types matching schema.sql.
// Keep in sync when you edit schema.sql.

export type UserRole = 'client' | 'worker' | 'admin';
export type ContractStatus = 'pending_payment' | 'active' | 'completed' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type TransactionType = 'task_completion' | 'withdrawal' | 'refund' | 'adjustment';
export type MediaType = 'image' | 'video';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  google_token: string | null;
  google_refresh_token: string | null;
  youtube_access_granted: boolean;
  youtube_access_granted_at: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  channel_name: string;
  channel_url: string;
  channel_id: string | null;
  channel_image: string | null;
  target_subscribers: number;
  price_per_subscriber: number;
  total_amount: number;
  worker_payout_per_task: number;
  verified_count: number;
  pending_count: number;
  status: ContractStatus;
  payment_proof_url: string | null;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  completed_at: string | null;
}

export interface Completion {
  id: string;
  contract_id: string;
  worker_id: string;
  verified: boolean;
  payout_amount: number;
  claimed_at: string;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  screenshot_url: string | null;
  notes: string | null;
}

export interface Withdrawal {
  id: string;
  worker_id: string;
  amount: number;
  status: WithdrawalStatus;
  bank_name: string;
  account_number: string;
  account_name: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  contract_id: string;
  sender_id: string;
  sender_role: UserRole;
  message: string;
  media_url: string | null;
  media_type: MediaType | null;
  is_pinned: boolean;
  is_read: boolean;
  reminder_sent_at: string | null;
  created_at: string;
}

// Joined / extended shapes used by the dashboards
export interface ContractWithClient extends Contract {
  client: Pick<User, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface CompletionWithDetails extends Completion {
  contract: Pick<Contract, 'id' | 'channel_name' | 'channel_url' | 'channel_image' | 'target_subscribers' | 'verified_count'>;
  worker: Pick<User, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface WithdrawalWithWorker extends Withdrawal {
  worker: Pick<User, 'id' | 'email' | 'full_name' | 'avatar_url' | 'wallet_balance'>;
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role'>;
}

// Return types from the RPCs (mirrors PL/pgSQL JSON output in schema.sql)
export interface VerifyCompletionResult {
  completion_id: string;
  worker_id?: string;
  payout_amount?: number;
  new_balance?: number;
  contract_id?: string;
  verified_count?: number;
  target?: number;
  contract_completed?: boolean;
  already_verified?: boolean;
}

export interface RejectCompletionResult {
  completion_id: string;
  rejected: true;
}

export interface MarkWithdrawalPaidResult {
  withdrawal_id: string;
  worker_id?: string;
  amount?: number;
  new_balance?: number;
  already_paid?: boolean;
}
