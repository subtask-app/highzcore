'use client';

// ChipMultiSelect — a chip grid for picking multiple options. Used on the
// worker wizard for languages, niches, devices.

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

export interface ChipMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  className?: string;
}

export function ChipMultiSelect({ options, value, onChange, max, className }: ChipMultiSelectProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (!max || value.length < max) {
      onChange([...value, v]);
    }
  };
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const selected = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => toggle(o.value)}
            aria-pressed={selected}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm font-medium transition-colors',
              selected
                ? 'bg-brand-tint border-brand text-brand'
                : 'bg-surface border-border text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Single-select sibling.
export function ChipSingleSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: Option[];
  value: string | null;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={cn(
              'inline-flex items-center h-9 px-4 rounded-full border text-sm font-medium transition-colors',
              selected
                ? 'bg-brand-tint border-brand text-brand'
                : 'bg-surface border-border text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
