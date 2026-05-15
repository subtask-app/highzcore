// Page wrapper for marketing routes — header + footer with content slot.

import { type ReactNode } from 'react';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
