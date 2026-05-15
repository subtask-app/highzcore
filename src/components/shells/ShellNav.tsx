'use client';

// ShellNav — the sidebar + mobile bottom-bar nav shared by every shell.
// Pure presentation; receives the items + active route from the parent.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentType } from 'react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string | number;
  exact?: boolean;
}

interface NavProps {
  items: NavItem[];
}

function isActive(pathname: string | null, href: string, exact?: boolean): boolean {
  if (!pathname) return false;
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
}

// ── Desktop sidebar — vertical list, 264px wide. ───────────────────────────
export function ShellSidebarNav({ items }: NavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ label, href, Icon, badge, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group inline-flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-surface-active text-fg'
                : 'text-fg-muted hover:text-fg hover:bg-surface-hover',
            )}
          >
            <Icon
              className={cn('h-4 w-4 shrink-0', active ? 'text-brand' : '')}
              strokeWidth={1.75}
            />
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                  active ? 'bg-brand text-brand-fg' : 'bg-surface-active text-fg-subtle',
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Mobile bottom bar — 4–5 items max, icon over label. ────────────────────
export function ShellMobileBar({ items }: NavProps) {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-elevated/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 h-14">
        {items.slice(0, 5).map(({ label, href, Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                active ? 'text-brand' : 'text-fg-subtle',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span className="truncate max-w-full px-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
