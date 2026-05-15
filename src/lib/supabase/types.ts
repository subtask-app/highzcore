// Database types — hand-mirrored from schema.sql (M1). Keep in sync when the
// schema changes. We don't run `supabase gen types` because:
//   1. The schema isn't applied to a live project yet (pre-M14).
//   2. Hand-written types let us add semantic helpers (e.g. JSONB shapes).
//
// Convention: every table has a Row, Insert, and Update shape. Insert =
// Row with default-having or nullable columns made optional. Update =
// every field optional. JSONB columns are typed with concrete interfaces
// where the shape is known.

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Enums ─────────────────────────────────────────────────────────────────
export type ProjectType =
  | 'insights'
  | 'abtest'
  | 'promote'
  | 'collab'
  | 'boost';

export type ProjectStatus =
  | 'draft'
  | 'pending_payment'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'flutterwave' | 'ccpayment' | 'direct_transfer' | 'admin_credit';
export type PaymentIntentStatus = 'pending' | 'succeeded' | 'failed' | 'expired' | 'refunded';
export type TaskStatus = 'available' | 'claimed' | 'submitted' | 'approved' | 'rejected' | 'expired';
export type WithdrawalStatus = 'requested' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type WorkerTier = 'A' | 'B' | 'C';
export type AudiencePlatform =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'telegram_channel'
  | 'whatsapp_group'
  | 'facebook'
  | 'youtube';
export type AudienceStatus = 'pending' | 'verified' | 'rejected';
export type LedgerEntryType = 'earning' | 'withdrawal' | 'refund' | 'bonus' | 'penalty' | 'adjustment';
export type NotificationChannel = 'in_app' | 'email' | 'telegram' | 'telegram_channel';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type AbtestKind = 'thumbnail' | 'title';
export type BoostKind = 'subscriber' | 'like' | 'comment' | 'watch';
export type CollabKind = 'shoutout' | 'joint_video' | 'live_stream' | 'channel_feature';
export type SubscriberBracket = '0-1k' | '1k-10k' | '10k-100k' | '100k+';
export type UploadCadence = 'less_than_1' | '1_to_4' | '5_to_8' | '9_plus';
export type Gender = 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
export type DisputeResolution = 'pending' | 'sided_with_creator' | 'sided_with_worker' | 'split';

// ─── Row shapes ────────────────────────────────────────────────────────────
export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  country: string | null;
  preferred_locale: string;
  is_creator: boolean;
  is_worker: boolean;
  is_admin: boolean;
  telegram_user_id: number | null;
  telegram_username: string | null;
  referral_code: string | null;
  referred_by_user_id: string | null;
  last_seen_at: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatorProfileRow = {
  user_id: string;
  business_name: string | null;
  primary_channel_url: string | null;
  primary_channel_id: string | null;
  primary_channel_handle: string | null;
  primary_channel_avatar_url: string | null;
  primary_channel_verified_at: string | null;
  subscriber_bracket: SubscriberBracket | null;
  channel_niche: string | null;
  upload_cadence: UploadCadence | null;
  growth_goals: string[];
  how_did_you_hear: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkerProfileRow = {
  user_id: string;
  state_region: string | null;
  city: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  languages: string[];
  niches: string[];
  devices: string[];
  hours_per_day_available: number | null;
  short_bio: string | null;
  usdt_trc20_address: string | null;
  earnings_balance: number;
  pending_balance: number;
  lifetime_earned: number;
  lifetime_withdrawn: number;
  reliability_score: number;
  quality_score: number;
  completion_rate: number;
  tier: WorkerTier;
  onboarded_at: string | null;
  last_task_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkerAudienceRow = {
  id: string;
  worker_id: string;
  platform: AudiencePlatform;
  handle: string;
  profile_url: string | null;
  verified_follower_count: number | null;
  verification_method: string | null;
  verification_evidence_url: string | null;
  status: AudienceStatus;
  rejected_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// JSONB shape for `projects.target_demographics`.
export type TargetDemographics = {
  countries?: string[];
  languages?: string[];
  niches?: string[];
  age_min?: number;
  age_max?: number;
  genders?: Gender[];
  min_followers?: number;
}

export type ProjectRow = {
  id: string;
  creator_id: string;
  type: ProjectType;
  status: ProjectStatus;
  title: string;
  video_url: string | null;
  video_id: string | null;
  video_duration_seconds: number | null;
  target_demographics: TargetDemographics;
  target_response_count: number | null;
  collected_response_count: number;
  price_usd: number;
  platform_fee_usd: number;
  worker_pool_usd: number;
  worker_payout_per_task_usd: number;
  paid_at: string | null;
  launched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

// JSONB shape for `insights_studies.questions`.
export type InsightQuestionType = 'multiple_choice' | 'short_text' | 'long_text' | 'timestamp' | 'rating';
export type InsightQuestion = {
  id: string;
  type: InsightQuestionType;
  prompt: string;
  required: boolean;
  options?: string[];
}

export type InsightsStudyRow = {
  project_id: string;
  questions: InsightQuestion[];
  use_default_questions: boolean;
  created_at: string;
}

// JSONB shape for `abtest_tests.variants`.
export type AbtestVariant = {
  id: string;
  label: string;
  image_url?: string | null;
  text?: string | null;
}

export type AbtestTestRow = {
  project_id: string;
  kind: AbtestKind;
  variants: AbtestVariant[];
  result_summary: Record<string, unknown> | null;
  winning_variant_id: string | null;
  created_at: string;
}

export type PromoteCampaignRow = {
  project_id: string;
  target_platforms: string[];
  min_audience_per_share: number;
  target_reach: number | null;
  target_clicks: number | null;
  share_message_template: string | null;
  utm_campaign: string;
  created_at: string;
}

export type CollabMatchRow = {
  project_id: string;
  creator_a_id: string;
  creator_b_id: string;
  kind: CollabKind;
  proposed_terms: string;
  agreed_deadline: string | null;
  escrow_a_usd: number;
  escrow_b_usd: number;
  a_confirmed_complete: boolean;
  b_confirmed_complete: boolean;
  proposed_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
}

export type BoostOrderRow = {
  project_id: string;
  kind: BoostKind;
  target_count: number;
  delivered_count: number;
  drip_rate_per_day: number;
  niche_match_required: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export type TaskRow = {
  id: string;
  project_id: string;
  type: ProjectType;
  status: TaskStatus;
  assigned_to: string | null;
  worker_payout_usd: number;
  response: Record<string, unknown> | null;
  evidence_url: string | null;
  claimed_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentIntentRow = {
  id: string;
  project_id: string;
  user_id: string;
  amount_usd: number;
  currency_local: string | null;
  amount_local: number | null;
  method: PaymentMethod;
  status: PaymentIntentStatus;
  provider_ref: string | null;
  provider_response: Record<string, unknown> | null;
  failed_reason: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WithdrawalRow = {
  id: string;
  worker_id: string;
  amount_usd: number;
  fee_usd: number;
  net_usd: number;
  destination_address: string;
  status: WithdrawalStatus;
  provider: string;
  provider_ref: string | null;
  provider_tx_hash: string | null;
  failed_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export type LedgerEntryRow = {
  id: string;
  user_id: string;
  entry_type: LedgerEntryType;
  amount_usd: number;
  balance_after_usd: number;
  task_id: string | null;
  withdrawal_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: number;
  template_key: string | null;
  template_data: Record<string, unknown> | null;
  subject: string | null;
  body: string | null;
  email_to: string | null;
  telegram_chat_id: number | null;
  attempt_count: number;
  next_attempt_at: string | null;
  last_error: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SupportMessageRow = {
  id: string;
  user_id: string | null;
  telegram_user_id: number | null;
  telegram_username: string | null;
  direction: 'inbound' | 'outbound';
  body: string | null;
  attachments: Record<string, unknown> | null;
  forwarded_to_group: boolean;
  forwarded_message_id: number | null;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── Insert + Update shapes ────────────────────────────────────────────────
// Convention:
//   - `Insert`: required keys are columns without defaults and not nullable;
//     everything else optional.
//   - `Update`: every field optional.

type NullableDefaulted<T> = Partial<T>;

export type UserInsert = Partial<UserRow> & {
  id: string;
  email: string;
}
export type UserUpdate = Partial<UserRow>;

export type CreatorProfileInsert = Partial<CreatorProfileRow> & {
  user_id: string;
}
export type CreatorProfileUpdate = Partial<CreatorProfileRow>;

export type WorkerProfileInsert = Partial<WorkerProfileRow> & {
  user_id: string;
}
export type WorkerProfileUpdate = Partial<WorkerProfileRow>;

export type WorkerAudienceInsert = Partial<WorkerAudienceRow> & {
  worker_id: string;
  platform: AudiencePlatform;
  handle: string;
}
export type WorkerAudienceUpdate = Partial<WorkerAudienceRow>;

export type ProjectInsert = Partial<ProjectRow> & {
  creator_id: string;
  type: ProjectType;
  title: string;
  price_usd: number;
  platform_fee_usd: number;
  worker_pool_usd: number;
  worker_payout_per_task_usd: number;
}
export type ProjectUpdate = Partial<ProjectRow>;

// ─── Database union shape used by the Supabase client generic ──────────────
// Tables must satisfy the postgrest-js GenericTable shape: Row, Insert,
// Update, AND a Relationships array (even if empty). We don't model
// relationships explicitly yet — keep the array empty until needed.

type T<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      users:              T<UserRow,            UserInsert,            UserUpdate>;
      creator_profiles:   T<CreatorProfileRow,  CreatorProfileInsert,  CreatorProfileUpdate>;
      worker_profiles:    T<WorkerProfileRow,   WorkerProfileInsert,   WorkerProfileUpdate>;
      worker_audiences:   T<WorkerAudienceRow,  WorkerAudienceInsert,  WorkerAudienceUpdate>;
      projects:           T<ProjectRow,         ProjectInsert,         ProjectUpdate>;
      insights_studies:   T<InsightsStudyRow,   Partial<InsightsStudyRow> & { project_id: string; questions: InsightQuestion[] }, Partial<InsightsStudyRow>>;
      abtest_tests:       T<AbtestTestRow,      Partial<AbtestTestRow> & { project_id: string; kind: AbtestKind; variants: AbtestVariant[] }, Partial<AbtestTestRow>>;
      promote_campaigns:  T<PromoteCampaignRow, Partial<PromoteCampaignRow> & { project_id: string; target_platforms: string[]; utm_campaign: string }, Partial<PromoteCampaignRow>>;
      collab_matches:     T<CollabMatchRow,     Partial<CollabMatchRow> & { project_id: string; creator_a_id: string; creator_b_id: string; kind: CollabKind; proposed_terms: string }, Partial<CollabMatchRow>>;
      boost_orders:       T<BoostOrderRow,      Partial<BoostOrderRow> & { project_id: string; kind: BoostKind; target_count: number }, Partial<BoostOrderRow>>;
      tasks:              T<TaskRow,            Partial<TaskRow> & { project_id: string; type: ProjectType; worker_payout_usd: number }, Partial<TaskRow>>;
      payment_intents:    T<PaymentIntentRow,   Partial<PaymentIntentRow> & { project_id: string; user_id: string; amount_usd: number; method: PaymentMethod }, Partial<PaymentIntentRow>>;
      withdrawals:        T<WithdrawalRow,      Partial<WithdrawalRow> & { worker_id: string; amount_usd: number; fee_usd: number; net_usd: number; destination_address: string }, Partial<WithdrawalRow>>;
      ledger_entries:     T<LedgerEntryRow,     Partial<LedgerEntryRow> & { user_id: string; entry_type: LedgerEntryType; amount_usd: number; balance_after_usd: number }, Partial<LedgerEntryRow>>;
      notifications:      T<NotificationRow,    Partial<NotificationRow> & { channel: NotificationChannel }, Partial<NotificationRow>>;
      support_messages:   T<SupportMessageRow,  Partial<SupportMessageRow> & { direction: 'inbound' | 'outbound' }, Partial<SupportMessageRow>>;
      audit_log:          T<AuditLogRow,        Partial<AuditLogRow> & { action: string }, Partial<AuditLogRow>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      project_type: ProjectType;
      project_status: ProjectStatus;
      payment_method: PaymentMethod;
      payment_intent_status: PaymentIntentStatus;
      task_status: TaskStatus;
      withdrawal_status: WithdrawalStatus;
      worker_tier: WorkerTier;
      audience_platform: AudiencePlatform;
      audience_status: AudienceStatus;
      ledger_entry_type: LedgerEntryType;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      abtest_kind: AbtestKind;
      boost_kind: BoostKind;
      collab_kind: CollabKind;
      subscriber_bracket: SubscriberBracket;
      upload_cadence: UploadCadence;
      gender: Gender;
      dispute_resolution: DisputeResolution;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

export type TypedSupabaseClient = SupabaseClient<Database>;
