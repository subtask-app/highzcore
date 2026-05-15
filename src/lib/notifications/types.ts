// Notification template keys + payload shapes. The cron drain renders these
// using src/lib/notifications/templates.ts and dispatches via Telegram /
// channel / email per the row's channel column.
//
// Naming convention: `<domain>.<event>` — same as the keys used by the
// product-side server actions when they enqueue.

export type NotificationTemplateKey =
  // Task lifecycle (worker-facing)
  | 'task.approved'
  | 'task.rejected'
  // Audience verification (worker-facing)
  | 'audience.verified'
  | 'audience.rejected'
  // Withdrawals (worker-facing)
  | 'withdrawal.completed'
  | 'withdrawal.failed'
  // Collab (creator-to-creator)
  | 'collab.proposed'
  | 'collab.accepted'
  | 'collab.declined'
  | 'collab.confirm'
  // Project lifecycle (creator-facing)
  | 'project.first_responses'
  | 'project.completed'
  // Channel announcements (no user_id; goes to TELEGRAM_CHANNEL)
  | 'channel.new_insights'
  | 'channel.new_promote'
  | 'channel.new_abtest'
  | 'channel.announcement';

// Per-template payload shapes. Templates assume these are present; we
// validate at the rendering step (return a short fallback string instead
// of crashing if a field is missing).
export interface NotificationPayloads {
  'task.approved':       { amount_usd: number; project_title: string; project_type: string };
  'task.rejected':       { reason: string; project_title: string };
  'audience.verified':   { platform: string; handle: string };
  'audience.rejected':   { platform: string; handle: string; reason: string };
  'withdrawal.completed':{ amount_usd: number; net_usd: number; tx_hash: string };
  'withdrawal.failed':   { amount_usd: number; reason: string };
  'collab.proposed':     { project_id: string; kind: string; escrow_usd: number };
  'collab.accepted':     { project_id: string };
  'collab.declined':     { project_id: string; reason?: string };
  'collab.confirm':      { project_id: string; both_confirmed: boolean };
  'project.first_responses': { project_id: string; project_title: string; count: number };
  'project.completed':   { project_id: string; project_title: string };
  'channel.new_insights':{ project_id: string; project_title: string; per_task_usd: number; target_count: number };
  'channel.new_promote': { project_id: string; project_title: string; per_task_usd: number; platforms: string[] };
  'channel.new_abtest':  { project_id: string; project_title: string; per_task_usd: number; kind: string };
  'channel.announcement':{ subject: string; body: string };
}

export type NotificationPayload<K extends NotificationTemplateKey> = NotificationPayloads[K];

export interface RenderedMessage {
  text: string;
  /** Inline-keyboard JSON for Telegram (web-app or url button). */
  reply_markup?: {
    inline_keyboard: Array<Array<
      | { text: string; url: string }
      | { text: string; web_app: { url: string } }
    >>;
  };
}
