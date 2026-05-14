// Template registry. Adding a template: add the file, then add it here.
import type { EmailPayload, EmailType, RenderedEmail } from './types';

import { render as new_contract_invoice }     from './templates/new-contract-invoice';
import { render as task_approved_broadcast }  from './templates/task-approved-broadcast';
import { render as admin_no_reply_reminder }  from './templates/admin-no-reply-reminder';
import { render as client_no_reply_reminder } from './templates/client-no-reply-reminder';
import { render as new_admin_message }        from './templates/new-admin-message';
import { render as task_verified }            from './templates/task-verified';
import { render as task_rejected_warning }    from './templates/task-rejected-warning';
import { render as campaign_completed }       from './templates/campaign-completed';

const registry = {
  new_contract_invoice,
  task_approved_broadcast,
  admin_no_reply_reminder,
  client_no_reply_reminder,
  new_admin_message,
  task_verified,
  task_rejected_warning,
  campaign_completed,
} as const satisfies { [K in EmailType]: (p: EmailPayload<K>) => RenderedEmail };

export function renderEmail<T extends EmailType>(type: T, payload: EmailPayload<T>): RenderedEmail {
  const render = registry[type] as (p: EmailPayload<T>) => RenderedEmail;
  if (!render) throw new Error(`No template registered for type "${type}"`);
  return render(payload);
}
