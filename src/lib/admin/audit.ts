// Audit-log helper. Every admin action that mutates state should call
// writeAudit() so we have a forever record of who did what + when.

import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';

export interface AuditEntry {
  actor_user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  diff?: Record<string, unknown>;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const admin = serviceClient<Database>();
  await admin.from('audit_log').insert({
    actor_user_id: entry.actor_user_id,
    action: entry.action,
    entity_type: entry.entity_type ?? null,
    entity_id: entry.entity_id ?? null,
    diff: entry.diff ?? null,
  });
}
