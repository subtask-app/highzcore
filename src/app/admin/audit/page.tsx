// /admin/audit — audit log viewer.

import { Card } from '@/components/ui';
import { fetchAuditLog } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ action?: string }>;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const entries = await fetchAuditLog({ action: sp.action, limit: 300 });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Audit log</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Every admin action, oldest at the bottom. Append-only.
        </p>
      </header>

      {entries.length === 0 ? (
        <Card padding="md"><p className="text-sm text-fg-muted">Nothing logged yet.</p></Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <div key={e.id} className="px-4 md:px-6 py-3 grid md:grid-cols-[140px_180px_1fr_180px] items-start gap-3">
                <span className="text-xs text-fg-muted font-mono tabular">{fmtDateTime(e.created_at)}</span>
                <span className="text-sm text-fg-muted truncate">
                  {e.actor_name ?? e.actor_email ?? '—'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{e.action}</p>
                  {e.diff && (
                    <pre className="mt-1 text-xs text-fg-muted bg-surface-hover rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(e.diff, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-xs text-fg-subtle font-mono break-all">
                  {e.entity_type && <>{e.entity_type}:{e.entity_id ?? '—'}</>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
