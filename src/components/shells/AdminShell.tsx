// AdminShell — internal admin tooling layout.

import { Activity, AlertTriangle, Coins, FolderKanban, Home, Users } from 'lucide-react';
import { type ReactNode } from 'react';
import { ShellHeader } from './ShellHeader';
import { ShellSidebarNav, ShellMobileBar, type NavItem } from './ShellNav';

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview',    href: '/admin',             Icon: Home,            exact: true },
  { label: 'Projects',    href: '/admin/projects',    Icon: FolderKanban },
  { label: 'Workers',     href: '/admin/workers',     Icon: Users },
  { label: 'Finance',     href: '/admin/finance',     Icon: Coins },
  { label: 'Disputes',    href: '/admin/disputes',    Icon: AlertTriangle },
  { label: 'Audit log',   href: '/admin/audit',       Icon: Activity },
];

const ADMIN_NAV_MOBILE: NavItem[] = ADMIN_NAV.slice(0, 5);

export interface AdminShellProps {
  headerRight?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
}

export function AdminShell({ headerRight, title, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <ShellHeader right={headerRight} title={title} />
      <div className="flex-1 flex w-full">
        <aside className="hidden md:flex shrink-0 w-[264px] border-r border-border p-4 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none">
          <ShellSidebarNav items={ADMIN_NAV} />
        </aside>
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
          <div className="mx-auto max-w-[1440px] w-full">{children}</div>
        </main>
      </div>
      <ShellMobileBar items={ADMIN_NAV_MOBILE} />
    </div>
  );
}
