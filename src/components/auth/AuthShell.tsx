// AuthShell — centered-card layout shared by every page in the auth flow
// (signup chooser, signup forms, login, forgot password, OAuth landings).

import Link from 'next/link';
import { type ReactNode } from 'react';
import Logo from '@/components/brand/Logo';
import { ThemeQuickToggle } from '@/components/theme/ThemeToggle';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface AuthShellProps {
  title: string;
  description?: ReactNode;
  /** Render below the form (e.g. "Already have an account? Log in"). */
  footer?: ReactNode;
  /** Render a back-to-previous link in the top-left. */
  backHref?: string;
  className?: string;
  children: ReactNode;
}

export function AuthShell({ title, description, footer, backHref, className, children }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <header className="flex items-center gap-3 px-4 md:px-8 h-16">
        <Logo size="sm" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeQuickToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Card padding="xl" className={cn('w-full max-w-md', className)}>
          {backHref && (
            <Link href={backHref} className="inline-flex items-center text-xs text-fg-muted hover:text-fg mb-4">
              ← Back
            </Link>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm md:text-base text-fg-muted leading-relaxed">{description}</p>
          )}
          <div className="mt-8">{children}</div>
        </Card>
        {footer && (
          <p className="mt-6 text-sm text-fg-muted text-center">{footer}</p>
        )}
      </main>
      <footer className="px-4 py-6 text-center text-xs text-fg-subtle">
        © 2026 Highzcore.{' '}
        <Link href="/privacy" className="hover:text-fg">Privacy</Link>{' · '}
        <Link href="/terms" className="hover:text-fg">Terms</Link>
      </footer>
    </div>
  );
}
