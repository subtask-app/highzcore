// /admin/projects/[id] — admin view of a single project with its task
// moderation queue inline.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card, ProductBadge, productLabel } from '@/components/ui';
import { ProjectStatusBadge } from '@/components/creator/ProjectStatusBadge';
import { TaskModerationRow } from '@/components/admin/TaskModerationRow';
import { fetchModerationQueue } from '@/lib/admin/queries';
import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmt(usd: number) { return `$${Number(usd).toFixed(2)}`; }

export default async function AdminProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = serviceClient<Database>();
  const { data: project } = await admin
    .from('projects')
    .select('*, creator:users(id, full_name, email)')
    .eq('id', id)
    .maybeSingle();
  if (!project) notFound();
  type Joined = typeof project & { creator: { id: string; full_name: string | null; email: string } | null };
  const p = project as unknown as Joined;

  const queue = await fetchModerationQueue(id);

  const { count: approved } = await admin
    .from('tasks').select('id', { count: 'exact', head: true })
    .eq('project_id', id).eq('status', 'approved');
  const { count: submitted } = await admin
    .from('tasks').select('id', { count: 'exact', head: true })
    .eq('project_id', id).eq('status', 'submitted');
  const { count: claimed } = await admin
    .from('tasks').select('id', { count: 'exact', head: true })
    .eq('project_id', id).eq('status', 'claimed');
  const { count: available } = await admin
    .from('tasks').select('id', { count: 'exact', head: true })
    .eq('project_id', id).eq('status', 'available');

  return (
    <div className="space-y-8">
      <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <header className="flex items-start gap-4 flex-wrap">
        <ProductBadge product={p.type} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">{p.title}</h1>
          <p className="mt-1 text-sm text-fg-muted inline-flex flex-wrap items-center gap-2">
            {productLabel(p.type)}
            <span aria-hidden>·</span>
            <ProjectStatusBadge status={p.status} />
            <span aria-hidden>·</span>
            Creator: {p.creator?.full_name ?? p.creator?.email ?? '—'}
          </p>
        </div>
      </header>

      {/* Money */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Block label="Price" value={fmt(Number(p.price_usd))} />
        <Block label="Worker pool" value={fmt(Number(p.worker_pool_usd))} />
        <Block label="Platform fee" value={fmt(Number(p.platform_fee_usd))} />
        <Block label="Per-task payout" value={fmt(Number(p.worker_payout_per_task_usd))} />
      </section>

      {/* Progress */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Block label="Approved" value={String(approved ?? 0)} />
        <Block label="In review" value={String(submitted ?? 0)} />
        <Block label="Claimed" value={String(claimed ?? 0)} />
        <Block label="Available" value={String(available ?? 0)} />
      </section>

      {p.video_url && (
        <Card padding="md">
          <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand">
            Open target video <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      )}

      {/* Queue */}
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Submitted tasks ({queue.length})</h2>
        {queue.length === 0 ? (
          <Card padding="md"><p className="text-sm text-fg-muted">No tasks awaiting review.</p></Card>
        ) : (
          <div className="grid gap-3">
            {queue.map((t) => <TaskModerationRow key={t.id} task={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</p>
      <p className="mt-1 font-mono tabular text-xl font-semibold text-fg">{value}</p>
    </Card>
  );
}
