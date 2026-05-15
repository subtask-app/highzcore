'use client';

// Worker survey form — driven by the question list pulled from
// insights_studies. Renders different controls per type, validates required
// fields, posts to submitInsightsTask which calls the submit_task RPC.

import { useState, useTransition, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import type { InsightQuestion } from '@/lib/supabase/types';
import { submitInsightsTask } from '@/lib/insights/actions';
import { formatDuration } from '@/lib/youtube/video-meta';
import { cn } from '@/lib/utils';

interface Props {
  taskId: string;
  questions: InsightQuestion[];
  videoSeconds: number;
  watchSeconds: number; // updated by the embed via parent state
}

export function StudyForm({ taskId, questions, videoSeconds, watchSeconds }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const requiredMet = questions
    .filter((q) => q.required)
    .every((q) => {
      const v = answers[q.id];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });

  // Minimum watch threshold: 60% of video length, capped at 5 minutes for
  // long videos so 30-minute studies don't trap workers.
  const minWatch = Math.min(300, videoSeconds * 0.6);
  const watchMet = watchSeconds >= minWatch;

  const canSubmit = requiredMet && watchMet && !pending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!requiredMet) { setError('Answer the required questions first.'); return; }
    if (!watchMet)    { setError(`Watch at least ${formatDuration(minWatch)} before submitting.`); return; }

    startTransition(async () => {
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          value: answers[q.id] ?? null,
        })),
        watch_seconds: Math.round(watchSeconds),
        total_seconds: videoSeconds,
      };
      const result = await submitInsightsTask(taskId, payload);
      if ('error' in result) {
        setError(humanise(result.error));
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card padding="md" className={cn('flex items-center gap-3', watchMet ? 'border-success/30' : 'border-warning/30')}>
        <div className="flex-1">
          <p className="text-sm font-semibold text-fg">
            {watchMet ? '✓ Watch time reached.' : `Keep watching — ${formatDuration(Math.max(0, minWatch - watchSeconds))} to go`}
          </p>
          <p className="text-xs text-fg-muted mt-0.5">
            Watched: {formatDuration(watchSeconds)} of {formatDuration(videoSeconds)} required.
          </p>
        </div>
      </Card>

      {questions.map((q, i) => (
        <Card key={q.id} padding="md">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
            Question {i + 1}{q.required && <span className="text-danger ml-1">*</span>}
          </p>
          <p className="mt-1 text-base font-semibold text-fg leading-snug">{q.prompt}</p>
          <div className="mt-4">
            <QuestionInput
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              videoSeconds={videoSeconds}
            />
          </div>
        </Card>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={!canSubmit} loading={pending}>
        Submit response
      </Button>
      <p className="text-xs text-fg-subtle text-center">
        Your payout becomes pending once you submit, and lands in your balance after admin approval.
      </p>
    </form>
  );
}

function QuestionInput({ question, value, onChange, videoSeconds }: {
  question: InsightQuestion;
  value: string | number | null;
  onChange: (v: string | number | null) => void;
  videoSeconds: number;
}) {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((o) => (
            <label key={o} className="flex items-start gap-3 cursor-pointer rounded-md p-2 hover:bg-surface-hover">
              <input
                type="radio"
                name={question.id}
                value={o}
                checked={value === o}
                onChange={() => onChange(o)}
                className="mt-1"
              />
              <span className="text-sm text-fg">{o}</span>
            </label>
          ))}
        </div>
      );
    case 'short_text':
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
        />
      );
    case 'long_text':
      return (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="A sentence or two."
        />
      );
    case 'rating':
      return (
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} out of 5`}
              className={cn(
                'p-1 transition-colors',
                Number(value) >= n ? 'text-warning' : 'text-fg-subtle hover:text-warning',
              )}
            >
              <Star className="h-7 w-7" fill={Number(value) >= n ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      );
    case 'timestamp':
      return (
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={videoSeconds}
            step={1}
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm tabular text-fg-muted">
            {typeof value === 'number' ? formatDuration(value) : 'Not yet'} of {formatDuration(videoSeconds)}
          </p>
        </div>
      );
  }
}

function humanise(code: string): string {
  switch (code) {
    case 'no_answers':         return 'Add at least one answer before submitting.';
    case 'not_authenticated':  return 'Your session expired. Log in again.';
    default:                   return `Something went wrong: ${code}.`;
  }
}
