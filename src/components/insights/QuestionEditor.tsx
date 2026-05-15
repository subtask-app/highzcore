'use client';

// Inline editor for the Insights question set. Shows each question with type,
// prompt, options (when applicable), required flag, and edit/delete handles.

import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Checkbox, Input, Select } from '@/components/ui';
import type { InsightQuestion, InsightQuestionType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: { value: InsightQuestionType; label: string; hint: string }[] = [
  { value: 'multiple_choice', label: 'Multiple choice', hint: 'Single-select; you provide options.' },
  { value: 'short_text',      label: 'Short text',     hint: 'One-line answer.' },
  { value: 'long_text',       label: 'Long text',      hint: 'Paragraph answer.' },
  { value: 'rating',          label: 'Star rating',    hint: '1–5 stars.' },
  { value: 'timestamp',       label: 'Timestamp',      hint: 'Pick a moment in the video.' },
];

function genId() {
  return `q${Math.random().toString(36).slice(2, 8)}`;
}

export interface QuestionEditorProps {
  value: InsightQuestion[];
  onChange: (next: InsightQuestion[]) => void;
  className?: string;
}

export function QuestionEditor({ value, onChange, className }: QuestionEditorProps) {
  const update = (idx: number, patch: Partial<InsightQuestion>) => {
    onChange(value.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () =>
    onChange([
      ...value,
      { id: genId(), type: 'short_text', prompt: '', required: false },
    ]);

  return (
    <div className={cn('space-y-3', className)}>
      {value.map((q, i) => (
        <QuestionRow
          key={q.id}
          index={i}
          question={q}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
        />
      ))}
      <Button type="button" variant="secondary" onClick={add} leftIcon={<Plus className="h-4 w-4" />}>
        Add question
      </Button>
    </div>
  );
}

function QuestionRow({
  index,
  question,
  onChange,
  onRemove,
}: {
  index: number;
  question: InsightQuestion;
  onChange: (patch: Partial<InsightQuestion>) => void;
  onRemove: () => void;
}) {
  const [optionsText, setOptionsText] = useState((question.options ?? []).join('\n'));
  const needsOptions = question.type === 'multiple_choice';

  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-active text-xs font-bold text-fg-muted">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="grid md:grid-cols-[1fr_180px] gap-3">
            <Input
              label="Question prompt"
              value={question.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              placeholder="Did the title match the content?"
              required
            />
            <Select
              label="Type"
              value={question.type}
              onChange={(e) => onChange({ type: e.target.value as InsightQuestionType })}
              options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>
          {needsOptions && (
            <Input
              label="Options (one per line)"
              value={optionsText}
              onChange={(e) => {
                setOptionsText(e.target.value);
                const next = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                onChange({ options: next });
              }}
              placeholder={'Yes\nNo\nMaybe'}
              helper="Workers pick exactly one."
            />
          )}
          <div className="flex items-center justify-between">
            <Checkbox
              label="Required"
              checked={question.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-fg-subtle hover:text-danger inline-flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-fg-subtle mt-2" aria-hidden="true" />
      </div>
    </Card>
  );
}
