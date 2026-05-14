// Telegram template registry — mirrors src/lib/email/render.ts but produces
// Telegram-shaped messages (HTML body + optional inline-keyboard) instead of
// HTML email bodies.
//
// Covers two payload families:
//   * EmailType  — events that also have an email renderer
//   * TelegramOnlyType — events without an email path (channel broadcasts)
//
// One unified registry, both families. Drain endpoint picks based on the
// queue row's channel ('telegram' → recipient DM, 'telegram_channel' → post
// to the community channel).

import type {
  EmailType,
  AnyTelegramType,
  AnyTelegramPayload,
} from '@/lib/email/types';
import type { TelegramRendered } from './templates/_layout';

import { render as new_contract_invoice }     from './templates/new-contract-invoice';
import { render as task_approved_broadcast }  from './templates/task-approved-broadcast';
import { render as admin_no_reply_reminder }  from './templates/admin-no-reply-reminder';
import { render as client_no_reply_reminder } from './templates/client-no-reply-reminder';
import { render as new_admin_message }        from './templates/new-admin-message';
import { render as task_verified }            from './templates/task-verified';
import { render as task_rejected_warning }    from './templates/task-rejected-warning';
import { render as campaign_completed }       from './templates/campaign-completed';
import { render as community_announcement }   from './templates/community-announcement';

const registry = {
  new_contract_invoice,
  task_approved_broadcast,
  admin_no_reply_reminder,
  client_no_reply_reminder,
  new_admin_message,
  task_verified,
  task_rejected_warning,
  campaign_completed,
  community_announcement,
} as const satisfies { [K in AnyTelegramType]: (p: AnyTelegramPayload<K>) => TelegramRendered };

export function renderTelegram<T extends AnyTelegramType>(type: T, payload: AnyTelegramPayload<T>): TelegramRendered {
  const render = registry[type] as (p: AnyTelegramPayload<T>) => TelegramRendered;
  if (!render) throw new Error(`No Telegram template registered for type "${type}"`);
  return render(payload);
}

// Also export EmailType pass-through for the user-DM branch of the drain.
export type { TelegramRendered, EmailType };
