// Email payload contract between Postgres (which fills JSONB) and templates.
// If you change the JSON in migrations/0001_email_queue.sql, change this file
// in lockstep — render() will fail loudly otherwise.

export type EmailPayloads = {
  new_contract_invoice: {
    contract_id: string;
    client_email: string | null;
    client_name: string | null;
    channel_name: string;
    channel_url: string;
    target_subscribers: number;
    total_amount: number;
  };
  task_approved_broadcast: {
    contract_id: string;
    channel_name: string;
    channel_url: string;
    target_subscribers: number;
    verified_count: number;
    payout: number;
  };
  admin_no_reply_reminder: {
    message_id: string;
    contract_id: string;
    channel_name: string;
    preview: string;
  };
  client_no_reply_reminder: {
    message_id: string;
    contract_id: string;
    channel_name: string;
    preview: string;
  };
  new_admin_message: {
    message_id: string;
    contract_id: string;
    channel_name: string;
    preview: string;
  };
  task_verified: {
    completion_id: string;
    channel_name: string;
    channel_url: string;
    payout_amount: number;
  };
  task_rejected_warning: {
    completion_id: string;
    channel_name: string;
    channel_url: string;
    reason: string;
  };
  campaign_completed: {
    contract_id: string;
    channel_name: string;
    target_subscribers: number;
  };
};

export type EmailType = keyof EmailPayloads;
export type EmailPayload<T extends EmailType> = EmailPayloads[T];

// ── Templates that ONLY go via Telegram (no email rendering) ────────────────
// Used for one-shot broadcasts to the community channel, etc. Lives in the
// same notification queue but its rows never end up with channel='email'.
export type TelegramOnlyPayloads = {
  community_announcement: {
    contract_id: string;
    channel_name: string;
    channel_url: string;
    target_subscribers: number;
    payout: number;
  };
};
export type TelegramOnlyType = keyof TelegramOnlyPayloads;

// Combined type for everything the Telegram side can render.
export type AnyTelegramType = EmailType | TelegramOnlyType;
export type AnyTelegramPayload<T extends AnyTelegramType> =
  T extends EmailType ? EmailPayloads[T]
  : T extends TelegramOnlyType ? TelegramOnlyPayloads[T]
  : never;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface PendingEmailRow {
  id: string;
  template: EmailType;
  recipient_email: string;
  recipient_user_id: string | null;
  payload: Record<string, unknown>;
  scheduled_for: string;
  sent_at: string | null;
  failed_at: string | null;
  error: string | null;
  attempts: number;
  dedupe_key: string | null;
  created_at: string;
}
