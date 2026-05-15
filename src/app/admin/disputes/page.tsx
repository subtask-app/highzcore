// /admin/disputes — disputes are wired into the schema (task_disputes) but
// the user-facing submission flow isn't built yet. For now this page just
// surfaces any rows that already exist + flags this as future work.

import { Card } from '@/components/ui';
import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminDisputesPage() {
  const admin = serviceClient<Database>();
  const { data: disputes } = await admin
    .from('task_disputes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Disputes</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Worker / creator disputes on task outcomes.
        </p>
      </header>

      <Card padding="md" className="border-dashed">
        <p className="text-sm text-fg-muted leading-relaxed">
          The user-facing dispute-submission flow is on the roadmap. Until it lands, raise disputes
          manually by adding a row to <code className="font-mono">task_disputes</code> or by editing
          a task's status directly.
        </p>
      </Card>

      {disputes && disputes.length > 0 && (
        <Card padding="none">
          <div className="divide-y divide-border">
            {disputes.map((d) => (
              <div key={d.id} className="px-4 md:px-6 py-3">
                <p className="text-sm font-semibold text-fg">
                  {d.raised_by_role}: {d.reason}
                </p>
                <p className="text-xs text-fg-muted font-mono">
                  task {d.task_id} · resolution: {d.resolution}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
