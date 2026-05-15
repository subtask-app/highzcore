'use client';

// Marketing header — sticky, blurred on scroll, primary nav + auth CTAs.
// Mobile collapses into a hamburger sheet.

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { ThemeQuickToggle } from '@/components/theme/ThemeToggle';
import { LinkButton } from '@/components/ui';
import { cn } from '@/lib/utils';

const PRIMARY_NAV: { href: string; label: string }[] = [
  { href: '/products/insights', label: 'Insights' },
  { href: '/products/abtest',   label: 'AB Test' },
  { href: '/products/promote',  label: 'Promote' },
  { href: '/products/collab',   label: 'Collab' },
  { href: '/pricing',           label: 'Pricing' },
  { href: '/for-creators',      label: 'For creators' },
  { href: '/for-workers',       label: 'For workers' },
  { href: '/compare',           label: 'Compare' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-elevated/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] flex items-center gap-6 px-4 md:px-8 h-16">
        <Logo size="sm" />
        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex items-center h-9 px-3 rounded-md text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeQuickToggle className="hidden sm:inline-flex" />
          <Link
            href="/login"
            className="hidden md:inline-flex h-9 items-center px-3 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute inset-y-0 right-0 w-80 max-w-full bg-bg-elevated border-l border-border',
              'flex flex-col',
            )}
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-2 overflow-y-auto">
              {PRIMARY_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center h-11 px-3 rounded-md text-base font-medium text-fg hover:bg-surface-hover"
                >
                  {n.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <Link
                href="/help"
                onClick={() => setOpen(false)}
                className="inline-flex items-center h-11 px-3 rounded-md text-sm font-medium text-fg-muted hover:bg-surface-hover"
              >
                Help
              </Link>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="inline-flex items-center h-11 px-3 rounded-md text-sm font-medium text-fg-muted hover:bg-surface-hover"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="inline-flex items-center h-11 px-3 rounded-md text-sm font-medium text-fg-muted hover:bg-surface-hover"
              >
                Contact
              </Link>
            </nav>
            <div className="mt-auto px-4 py-4 border-t border-border space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block w-full text-center h-11 leading-[44px] rounded-md text-sm font-semibold text-fg-muted hover:text-fg"
              >
                Log in
              </Link>
              <LinkButton href="/signup" fullWidth>
                Get started
              </LinkButton>
              <div className="pt-3 flex justify-center">
                <ThemeQuickToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
