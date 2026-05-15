// /creator/projects/[id] — project detail. For Insights projects, shows
// progress, target video, and (when populated) the report link. For other
// product types, shows a status placeholder until M7-M9 fill them in.

import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, BarChart3, ExternalLink, Users } from 'lucide-react';
import { Avatar, Card, LinkButton, ProductBadge, productLabel } from '@/components/ui';
import { ProjectStatusBadge } from '@/components/creator/ProjectStatusBadge';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';
import { fetchInsightsProject, progressFor } from '@/lib/insights/queries';
import { fetchAbtestProject, fetchAbtestVotes } from '@/lib/abtest/queries';
import { AbtestResult } from '@/components/abtest/AbtestResult';
import { fetchPromoteProject, fetchPromoteShares } from '@/lib/promote/queries';
import { PromoteResult } from '@/components/promote/PromoteResult';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function CreatorProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = serviceClient<Database>();
  const { data: project } = await admin.from('projects').select('*').eq('id', id).maybeSingle();
  if (!project) notFound();
  if (project.creator_id !== user.id) notFound();

  const isInsights = project.type === 'insights';
  const isAbtest = project.type === 'abtest';
  const isPromote = project.type === 'promote';
  const study = isInsights ? (await fetchInsightsProject(id))?.study : null;
  const abtest = isAbtest ? await fetchAbtestProject(id) : null;
  const abtestVotes = isAbtest ? await fetchAbtestVotes(id) : {};
  const promote = isPromote ? await fetchPromoteProject(id) : null;
  const promoteShares = isPromote ? await fetchPromoteShares(id) : [];
  const progress = progressFor(project);

  return (
    <div className="space-y-8">
      <Link href="/creator/projects" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      <header className="flex items-start gap-4 flex-wrap">
        <ProductBadge product={project.type} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg leading-tight">
            {project.title}
          </h1>
          <p className="mt-2 text-sm text-fg-muted inline-flex items-center gap-2 flex-wrap">
            <span>{productLabel(project.type)}</span>
            <span aria-hidden>·</span>
            <ProjectStatusBadge status={project.status} />
            <span aria-hidden>·</span>
            <span>Created {fmtDate(project.created_at)}</span>
          </p>
        </div>
      </header>

      {/* Progress + key stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Responses</p>
          <p className="mt-1 font-mono tabular text-3xl font-semibold text-fg">
            {progress.collected}<span className="text-fg-muted text-lg"> / {progress.target}</span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-surface-active overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                project.status === 'completed' ? 'bg-success' : 'bg-brand')}
              style={{ width: `${progress.progressPct}%` }}
            />
          </div>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Paid</p>
          <p className="mt-1 font-mono tabular text-3xl font-semibold text-fg">
            ${Number(project.price_usd).toFixed(0)}
          </p>
          <p className="text-xs text-fg-muted mt-1">
            ${Number(project.worker_pool_usd).toFixed(0)} to workers ·
            {' '}${Number(project.platform_fee_usd).toFixed(0)} platform fee
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Per-task payout</p>
          <p className="mt-1 font-mono tabular text-3xl font-semibold text-fg">
            ${Number(project.worker_payout_per_task_usd).toFixed(2)}
          </p>
          <p className="text-xs text-fg-muted mt-1">
            What each worker earns when their response is approved.
          </p>
        </Card>
      </section>

      {/* Video */}
      {project.video_url && (
        <Card padding="md" className="flex items-center gap-4">
          <Avatar name="YT" size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-fg">Target video</p>
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand"
            >
              {project.video_url} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </Card>
      )}

      {/* Per-product detail */}
      {isInsights && study ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Insights summary</h2>
            <LinkButton
              href={`/creator/projects/${project.id}/report`}
              leftIcon={<BarChart3 className="h-4 w-4" />}
            >
              Open report
            </LinkButton>
          </div>
          <Card padding="md" className="space-y-2">
            <p className="text-sm text-fg">
              {study.use_default_questions ? 'Using the default 6-question set.' : `${study.questions.length} custom questions.`}
            </p>
            <ol className="space-y-1.5 text-sm text-fg-muted">
              {study.questions.slice(0, 6).map((q, i) => (
                <li key={q.id} className="leading-snug">
                  <span className="font-semibold text-fg">{i + 1}.</span> {q.prompt}
                </li>
              ))}
            </ol>
          </Card>

          <Card padding="md" className="flex items-center gap-3">
            <Users className="h-5 w-5 text-fg-muted" />
            <p className="text-sm text-fg-muted">
              {project.status === 'active'
                ? `Live. We'll text you on Telegram every 25 responses, and again when it fills.`
                : project.status === 'completed'
                  ? 'Filled. Open the report for the full breakdown.'
                  : 'Awaiting payment to go live.'}
            </p>
          </Card>
        </section>
      ) : isAbtest && abtest?.test ? (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            {abtest.test.kind === 'thumbnail' ? 'Thumbnail' : 'Title'} test results
          </h2>
          <AbtestResult test={abtest.test} votesById={abtestVotes} />
        </section>
      ) : isPromote && promote?.campaign ? (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Campaign progress</h2>
          <PromoteResult
            campaign={promote.campaign}
            shares={promoteShares}
            targetShareCount={project.target_response_count ?? 0}
          />
        </section>
      ) : (
        <Card padding="md">
          <p className="text-sm text-fg-muted">
            Project-detail layout for <strong className="text-fg">{productLabel(project.type)}</strong>{' '}
            ships in the next milestone.
          </p>
        </Card>
      )}
    </div>
  );
}
