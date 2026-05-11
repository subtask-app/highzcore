// Database type definitions for SubTask.ng

export type UserRole = 'client' | 'worker' | 'admin';
export type TaskStatus = 'active' | 'completed' | 'expired';
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  google_token?: string | null;
  google_id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  wallet_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  channel_id: string;
  channel_url: string;
  channel_name?: string | null;
  channel_thumbnail?: string | null;
  target_count: number;
  completed_count: number;
  status: TaskStatus;
  amount_paid: number;
  worker_payout_per_task: number;
  payment_confirmed: boolean;
  payment_proof_url?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface Completion {
  id: string;
  task_id: string;
  worker_id: string;
  verified: boolean;
  payout_amount: number;
  completed_at: string;
  verified_at?: string | null;
  reverted: boolean;
  reverted_at?: string | null;
}

export interface Withdrawal {
  id: string;
  worker_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  admin_notes?: string | null;
}

export interface Transaction {
  id: string;
  user_id?: string | null;
  type: string;
  amount: number;
  balance_after?: number | null;
  reference_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  sender_role: UserRole;
  message: string;
  is_payment_proof: boolean;
  payment_proof_url?: string | null;
  is_read: boolean;
  created_at: string;
}

// Extended types with relations
export interface TaskWithClient extends Task {
  client: User;
}

export interface CompletionWithDetails extends Completion {
  task: Task;
  worker: User;
}

export interface WithdrawalWithWorker extends Withdrawal {
  worker: User;
}

export interface MessageWithSender extends Message {
  sender: User;
}

export interface TaskWithMessages extends Task {
  messages: Message[];
  client: User;
}

// Pricing packages
export interface PricingPackage {
  name: string;
  subscribers: number;
  price: number;
  popular?: boolean;
}

export const PRICING_PACKAGES: PricingPackage[] = [
  { name: 'Starter', subscribers: 100, price: 15000 },
  { name: 'Growth', subscribers: 500, price: 75000 },
  { name: 'Standard', subscribers: 1000, price: 150000, popular: true },
  { name: 'Premium', subscribers: 2000, price: 280000 },
];

export const WORKER_PAYOUT_PER_TASK = 120;
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
export const MIN_WITHDRAWAL_AMOUNT = 1000;
