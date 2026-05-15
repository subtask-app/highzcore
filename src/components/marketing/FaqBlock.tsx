'use client';

// Reusable FAQ accordion. Items render closed by default; only one open at
// a time. Server pages serialise the FAQ schema into JSON-LD separately.

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqBlock({ items, className }: { items: FaqItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(isOpen ? null : i)}
            aria-expanded={isOpen}
            className="block w-full text-left py-6"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-base md:text-lg font-semibold text-fg leading-snug">{item.q}</p>
              <span className="shrink-0 mt-1 text-fg-muted">
                {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </span>
            </div>
            {isOpen && (
              <p className="mt-3 text-sm md:text-base text-fg-muted leading-relaxed">{item.a}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
