// /admin/projects — all projects with type/status filters + moderation queue link.

import Link from 'next/link';
import { ProductBadge, Card, Badge } from '@/components/ui';
import { fetchAllProjects, fetchModerationQueue } from '@/lib/admin/queries';
import { ProjectStatusBadge } from '@/components/creator/ProjectStatusBadge';
import { TaskModerationRow } from '@/components/admin/TaskModerationRow';
import type { ProjectType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string }>;
}

const TYPES: { value: ProjectType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'insights', label: 'Insights' },
  { value: 'abtest', label: 'AB Tests' },
  { value: 'promote', label: 'Promote' },
  { value: 'collab', label: 'Collab' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const type = (sp.type as ProjectType | 'all' | undefined) ?? 'all';
  const status = sp.status;
  const showQueue = status === 'submitted';

  const projects = showQueue
    ? []
    : await fetchAllProjects({ type, status: status === 'submitted' ? undefined : status });
  const queue = showQueue ? await fetchModerationQueue() : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Projects</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Every project on the platform. Switch to the moderation queue to review submitted tasks.
        </p>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/projects?status=submitted"
          className={cn(
            'inline-flex items-center h-8 px-4 rounded-full border text-xs font-semibold transition-colors',
            showQueue ? 'bg-brand text-brand-fg border-brand' : 'bg-surface border-border text-fg-muted hover:bg-surface-hover hover:text-fg',
          )}
        >
          Moderation queue
        </Link>
        <span className="h-4 w-px bg-border mx-1" />
        {TYPES.map((t) => {
          const params = new URLSearchParams();
          if (t.value !== 'all') params.set('type', String(t.value));
          const href = params.toString() ? `/admin/projects?${params.toString()}` : '/admin/projects';
          const active = !showQueue && (type === t.value || (type === 'all' && t.value === 'all'));
          return (
            <Link
              key={t.value}
              href={href}
              className={cn(
                'inline-flex items-center h-7 px-3 rounded-full text-xs font-medium transition-colors',
                active ? 'bg-brand text-brand-fg' : 'bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {showQueue ? (
        queue.length === 0 ? (
          <Card padding="md">
            <p className="text-sm text-fg-muted">Queue is empty. Nice.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {queue.map((t) => <TaskModerationRow key={t.id} task={t} />)}
          </div>
        )
      ) : projects.length === 0 ? (
        <Card padding="md"><p className="text-sm text-fg-muted">No projects match those filters.</p></Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border">
            {projects.map((p) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 px-4 md:px-6 py-3 hover:bg-surface-hover">
                <ProductBadge product={p.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{p.title}</p>
                  <p className="text-xs text-fg-muted truncate">
                    {p.creator_name ?? p.creator_email ?? '—'} · {fmtDate(p.created_at)} ·
                    {' '}${Number(p.price_usd).toFixed(0)}
                  </p>
                </div>
                <ProjectStatusBadge status={p.status} />
                <Badge tone="neutral" size="xs">
                  {p.collected_response_count}/{p.target_response_count ?? '—'}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
