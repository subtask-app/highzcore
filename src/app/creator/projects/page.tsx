// /creator/projects — full project list. Server-rendered with the URL as
// the source of truth for filters (?status=active&type=insights).

import Link from 'next/link';
import { Filter, FolderKanban, Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Card, EmptyState, LinkButton } from '@/components/ui';
import { ProjectCard } from '@/components/creator/ProjectCard';
import { createClient } from '@/lib/supabase/server';
import { fetchProjects } from '@/lib/creator/queries';
import type { ProjectStatus, ProjectType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string }>;
}

const TYPES: { value: ProjectType | 'all'; label: string }[] = [
  { value: 'all',      label: 'All products' },
  { value: 'insights', label: 'Insights' },
  { value: 'abtest',   label: 'AB Tests' },
  { value: 'promote',  label: 'Promote' },
  { value: 'collab',   label: 'Collab' },
];

const STATUSES: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',             label: 'Any status' },
  { value: 'draft',           label: 'Draft' },
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'active',          label: 'Live' },
  { value: 'completed',       label: 'Completed' },
  { value: 'cancelled',       label: 'Cancelled' },
];

function safeType(v: string | undefined): ProjectType | 'all' {
  if (!v) return 'all';
  return ['insights', 'abtest', 'promote', 'collab', 'boost'].includes(v) ? (v as ProjectType) : 'all';
}

function safeStatus(v: string | undefined): ProjectStatus | 'all' {
  if (!v) return 'all';
  return ['draft', 'pending_payment', 'active', 'completed', 'cancelled', 'refunded'].includes(v)
    ? (v as ProjectStatus)
    : 'all';
}

export default async function CreatorProjectsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const type = safeType(sp.type);
  const status = safeStatus(sp.status);

  const projects = await fetchProjects(user.id, { type, status });

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Projects</h1>
          <p className="mt-2 text-sm md:text-base text-fg-muted">
            Every study, test, campaign, and collab you've started.
          </p>
        </div>
        <LinkButton href="/creator/projects/new" leftIcon={<Plus className="h-4 w-4" />}>
          New project
        </LinkButton>
      </header>

      {/* Filters */}
      <Card padding="sm" variant="plain" className="border border-border bg-surface flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          <Filter className="h-3.5 w-3.5" /> Filters
        </span>
        <FilterPills name="type" options={TYPES} current={type} />
        <FilterPills name="status" options={STATUSES} current={status} />
      </Card>

      {projects.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<FolderKanban className="h-7 w-7" strokeWidth={1.5} />}
            title={type === 'all' && status === 'all' ? 'No projects yet' : 'Nothing matches those filters'}
            description={
              type === 'all' && status === 'all'
                ? "Once you start a project, it'll appear here with progress + results."
                : 'Try clearing a filter or starting a new project.'
            }
            action={<LinkButton href="/creator/projects/new" leftIcon={<Plus className="h-4 w-4" />}>New project</LinkButton>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPills<T extends string>({
  name,
  options,
  current,
}: {
  name: 'type' | 'status';
  options: { value: T; label: string }[];
  current: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => {
        const params = new URLSearchParams();
        if (o.value !== 'all') params.set(name, String(o.value));
        const active = current === o.value;
        return (
          <Link
            key={String(o.value)}
            href={`/creator/projects${params.toString() ? `?${params.toString()}` : ''}`}
            className={cn(
              'inline-flex items-center h-7 px-3 rounded-full text-xs font-medium transition-colors',
              active
                ? 'bg-brand text-brand-fg'
                : 'bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
