// /creator/projects/[id]/report — Insights report. Per-question aggregates
// + a quotes feed. Designed to be readable on its own; the project detail
// page links here for the deep view.

import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, EmptyState, ProductBadge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchInsightsProject, fetchInsightsResponses } from '@/lib/insights/queries';
import { formatDuration } from '@/lib/youtube/video-meta';
import type { InsightQuestion } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorReportPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await fetchInsightsProject(id);
  if (!data || data.project.creator_id !== user.id) notFound();
  if (data.project.type !== 'insights' || !data.study) notFound();

  const responses = await fetchInsightsResponses(id);

  // Index answers by question id.
  const answersByQ: Record<string, Array<string | number | null>> = {};
  for (const r of responses) {
    for (const a of r.answers) {
      if (!answersByQ[a.question_id]) answersByQ[a.question_id] = [];
      answersByQ[a.question_id].push(a.value);
    }
  }

  return (
    <div className="space-y-10">
      <Link href={`/creator/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to project
      </Link>

      <header>
        <ProductBadge product="insights" size="md" />
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg mt-3">
          {data.project.title}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {responses.length} response{responses.length === 1 ? '' : 's'} so far.
        </p>
      </header>

      {responses.length === 0 ? (
        <Card padding="md">
          <EmptyState
            title="No responses yet"
            description="As workers submit their feedback, you'll see per-question summaries + quotes here."
          />
        </Card>
      ) : (
        <div className="space-y-12">
          {data.study.questions.map((q, idx) => (
            <QuestionReport
              key={q.id}
              index={idx}
              question={q}
              values={answersByQ[q.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionReport({ index, question, values }: { index: number; question: InsightQuestion; values: Array<string | number | null> }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Question {index + 1}</p>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-fg mt-1">{question.prompt}</h2>
      </div>
      {question.type === 'multiple_choice' && question.options && (
        <MultipleChoiceBars options={question.options} values={values} />
      )}
      {question.type === 'rating' && <RatingHistogram values={values} />}
      {question.type === 'timestamp' && <TimestampHistogram values={values} />}
      {(question.type === 'short_text' || question.type === 'long_text') && (
        <TextQuotes values={values} />
      )}
    </section>
  );
}

function MultipleChoiceBars({ options, values }: { options: string[]; values: Array<string | number | null> }) {
  const counts = options.map((o) => values.filter((v) => v === o).length);
  const total = counts.reduce((s, n) => s + n, 0);
  return (
    <Card padding="md" className="space-y-3">
      {options.map((o, i) => {
        const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
        return (
          <div key={o}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-fg">{o}</span>
              <span className="font-mono tabular text-fg-muted">{counts[i]} · {pct}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-active overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function RatingHistogram({ values }: { values: Array<string | number | null> }) {
  const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
  const buckets = [0, 0, 0, 0, 0];
  for (const n of nums) buckets[Math.round(n) - 1]++;
  const avg = nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
  const max = Math.max(1, ...buckets);
  return (
    <Card padding="md" className="space-y-3">
      <p className="text-sm text-fg-muted">
        Average rating: <span className="font-bold text-fg tabular">{avg.toFixed(2)}</span> / 5 ({nums.length} ratings)
      </p>
      <div className="flex items-end gap-2 h-32">
        {buckets.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <span className="text-xs font-mono tabular text-fg-muted">{count}</span>
            <div
              className="w-full bg-brand rounded-t-sm"
              style={{ height: `${(count / max) * 100}%` }}
            />
            <span className="text-xs text-fg-subtle">{i + 1}★</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TimestampHistogram({ values }: { values: Array<string | number | null> }) {
  const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 0);
  if (nums.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-fg-muted">No drop-off timestamps recorded.</p>
      </Card>
    );
  }
  const max = Math.max(...nums);
  const bucketCount = 20;
  const buckets = Array(bucketCount).fill(0);
  for (const n of nums) {
    const idx = Math.min(bucketCount - 1, Math.floor((n / (max + 1)) * bucketCount));
    buckets[idx]++;
  }
  const maxCount = Math.max(1, ...buckets);
  return (
    <Card padding="md" className="space-y-3">
      <p className="text-sm text-fg-muted">{nums.length} workers reported a drop-off point.</p>
      <div className="flex items-end gap-0.5 h-24">
        {buckets.map((count, i) => (
          <div
            key={i}
            className={cn('flex-1 rounded-t-sm bg-brand transition-all')}
            style={{ height: `${(count / maxCount) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-fg-subtle">
        <span>0:00</span>
        <span>{formatDuration(max)}</span>
      </div>
    </Card>
  );
}

function TextQuotes({ values }: { values: Array<string | number | null> }) {
  const quotes = values
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map((v) => String(v));
  if (quotes.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-fg-muted">No written feedback yet.</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {quotes.slice(0, 30).map((q, i) => (
        <Card key={i} padding="md">
          <p className="text-sm text-fg leading-relaxed">"{q}"</p>
        </Card>
      ))}
    </div>
  );
}
