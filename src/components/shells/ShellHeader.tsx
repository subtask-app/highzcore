'use client';

// ShellHeader — top bar shown on every dashboard shell. Holds logo,
// optional context block (e.g. role chip), and a slot for right-side actions
// (theme toggle, notifications, profile menu).

import { type ReactNode } from 'react';
import Logo from '@/components/brand/Logo';
import { ThemeQuickToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

export interface ShellHeaderProps {
  /** Right-aligned actions area (avatar menu, notifications, etc.). */
  right?: ReactNode;
  /** Optional centerpiece — page title, breadcrumb. */
  title?: ReactNode;
  className?: string;
}

export function ShellHeader({ right, title, className }: ShellHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6 h-14 md:h-16',
        'bg-bg-elevated/80 backdrop-blur-md border-b border-border',
        className,
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Logo size="sm" />
      {title && (
        <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
          <span className="text-sm font-medium text-fg-muted truncate">{title}</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        {right}
        <ThemeQuickToggle />
      </div>
    </header>
  );
}
