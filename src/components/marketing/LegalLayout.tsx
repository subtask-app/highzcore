// Shared legal-page layout. Wraps prose in the marketing chrome + a centered
// max-width that's tuned for reading (60–80 characters per line).

import { type ReactNode } from 'react';
import { MarketingLayout } from './MarketingLayout';

export interface LegalLayoutProps {
  title: string;
  description?: string;
  effectiveDate: string;
  children: ReactNode;
}

export function LegalLayout({ title, description, effectiveDate, children }: LegalLayoutProps) {
  return (
    <MarketingLayout>
      <article className="px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-fg leading-tight">{title}</h1>
          {description && (
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">{description}</p>
          )}
          <p className="mt-3 text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
            Effective {effectiveDate}
          </p>
          <div className="mt-12 space-y-8 text-base text-fg-muted leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_h2]:tracking-tight [&_h2]:mt-12 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-fg [&_h3]:mt-8 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:text-fg-muted [&_strong]:text-fg [&_a]:text-brand [&_a]:underline hover:[&_a]:no-underline">
            {children}
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
