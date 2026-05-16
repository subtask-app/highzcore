'use client';

// Marketing header — sticky, scroll-aware blur, animated active-route
// underline, mobile sheet with stagger reveal.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

const SECONDARY_NAV: { href: string; label: string }[] = [
  { href: '/help',    label: 'Help' },
  { href: '/about',   label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog',    label: 'Blog' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Scroll-aware blur. We always keep a small base tint so text reads
  // over the 3D hero backdrop; we amp it past the fold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-[background-color,backdrop-filter,border-color] duration-300',
        scrolled
          ? 'bg-bg-elevated/85 backdrop-blur-md border-b border-border'
          : 'bg-bg/40 backdrop-blur-sm border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-[1440px] flex items-center gap-3 sm:gap-6 px-3 sm:px-4 md:px-8 h-14 md:h-16">
        <Link href="/" aria-label="Highzcore home" className="relative inline-flex shrink-0">
          <span className={cn(
            'absolute inset-0 -z-10 rounded-full blur-xl transition-opacity duration-500',
            scrolled ? 'opacity-0' : 'opacity-40',
          )}
          style={{ background: 'radial-gradient(circle, var(--c-brand) 0%, transparent 70%)' }}
          aria-hidden="true"
          />
          <Logo size="sm" href={null} />
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV.map((n) => {
            const isActive = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'relative inline-flex items-center h-9 px-3 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {n.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-md bg-surface-hover"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeQuickToggle className="hidden md:inline-flex" />
          <Link
            href="/login"
            className="hidden md:inline-flex h-9 items-center px-3 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            Log in
          </Link>
          <LinkButton href="/signup" size="sm" className="hidden sm:inline-flex">
            Get started
          </LinkButton>
          <button
            type="button"
            className={cn(
              'lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md',
              'text-fg hover:bg-surface-hover',
              'border border-border bg-surface/60 backdrop-blur',
            )}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet — full-width on tiny phones, side sheet on tablet. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="absolute inset-0 bg-ink/70 backdrop-blur" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className={cn(
                'absolute inset-y-0 right-0 w-full sm:w-96 max-w-full bg-bg-elevated border-l border-border',
                'flex flex-col',
              )}
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-0.5 px-3 py-4 overflow-y-auto flex-1">
                <p className="px-3 text-[10px] uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-2">
                  Products
                </p>
                {PRIMARY_NAV.map((n, i) => (
                  <motion.div
                    key={n.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.03 }}
                  >
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'inline-flex w-full items-center h-12 px-3 rounded-md text-base font-medium',
                        pathname === n.href
                          ? 'bg-brand-tint text-brand'
                          : 'text-fg hover:bg-surface-hover',
                      )}
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="my-3 border-t border-border" />
                <p className="px-3 text-[10px] uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-2">
                  Resources
                </p>
                {SECONDARY_NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'inline-flex items-center h-11 px-3 rounded-md text-sm font-medium',
                      pathname === n.href ? 'text-brand' : 'text-fg-muted hover:text-fg hover:bg-surface-hover',
                    )}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="px-4 py-4 border-t border-border space-y-2.5">
                <span onClick={() => setOpen(false)}>
                  <LinkButton href="/signup" fullWidth size="lg">
                    Get started — free
                  </LinkButton>
                </span>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center h-11 leading-[44px] rounded-md text-sm font-semibold text-fg-muted hover:text-fg"
                >
                  Log in
                </Link>
                <div className="pt-2 flex justify-center">
                  <ThemeQuickToggle />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
