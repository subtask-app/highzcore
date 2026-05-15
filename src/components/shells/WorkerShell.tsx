// WorkerShell — wraps every page under /worker.

import { Briefcase, Home, Settings, Trophy, Wallet } from 'lucide-react';
import { type ReactNode } from 'react';
import { ShellHeader } from './ShellHeader';
import { ShellSidebarNav, ShellMobileBar, type NavItem } from './ShellNav';

const WORKER_NAV: NavItem[] = [
  { label: 'Home',         href: '/worker',          Icon: Home,        exact: true },
  { label: 'Tasks',        href: '/worker/tasks',    Icon: Briefcase },
  { label: 'Earnings',     href: '/worker/earnings', Icon: Wallet },
  { label: 'Achievements', href: '/worker/tier',     Icon: Trophy },
  { label: 'Settings',     href: '/worker/settings', Icon: Settings },
];

export interface WorkerShellProps {
  headerRight?: ReactNode;
  rightRail?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
}

export function WorkerShell({ headerRight, rightRail, title, children }: WorkerShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <ShellHeader right={headerRight} title={title} />
      <div className="flex-1 flex w-full">
        <aside className="hidden md:flex shrink-0 w-[264px] border-r border-border p-4 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none">
          <ShellSidebarNav items={WORKER_NAV} />
        </aside>
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
          <div className="mx-auto max-w-[1280px] w-full">{children}</div>
        </main>
        {rightRail && (
          <aside className="hidden xl:flex shrink-0 w-[320px] border-l border-border p-6 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none">
            {rightRail}
          </aside>
        )}
      </div>
      <ShellMobileBar items={WORKER_NAV} />
    </div>
  );
}
