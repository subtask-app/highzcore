// CreatorShell — wraps every page under /creator (or wherever creator routes
// land). Three-column desktop layout, bottom-bar on mobile.

import { Home, FolderKanban, Wallet, Users, Settings, MessageSquareHeart } from 'lucide-react';
import { type ReactNode } from 'react';
import { ShellHeader } from './ShellHeader';
import { ShellSidebarNav, ShellMobileBar, type NavItem } from './ShellNav';

const CREATOR_NAV: NavItem[] = [
  { label: 'Home',      href: '/creator',           Icon: Home,             exact: true },
  { label: 'Projects',  href: '/creator/projects',  Icon: FolderKanban },
  { label: 'Insights',  href: '/creator/insights',  Icon: MessageSquareHeart },
  { label: 'Audience',  href: '/creator/audience',  Icon: Users },
  { label: 'Settings',  href: '/creator/settings',  Icon: Settings },
];

const CREATOR_NAV_MOBILE: NavItem[] = [
  { label: 'Home',      href: '/creator',           Icon: Home,             exact: true },
  { label: 'Projects',  href: '/creator/projects',  Icon: FolderKanban },
  { label: 'Insights',  href: '/creator/insights',  Icon: MessageSquareHeart },
  { label: 'Wallet',    href: '/creator/wallet',    Icon: Wallet },
  { label: 'Settings',  href: '/creator/settings',  Icon: Settings },
];

export interface CreatorShellProps {
  /** Optional header right-side slot (avatar menu, notif bell). */
  headerRight?: ReactNode;
  /** Optional right-rail content (contextual help, recent activity). */
  rightRail?: ReactNode;
  /** Title shown in the header. */
  title?: ReactNode;
  children: ReactNode;
}

export function CreatorShell({ headerRight, rightRail, title, children }: CreatorShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <ShellHeader right={headerRight} title={title} />
      <div className="flex-1 flex w-full">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex shrink-0 w-[264px] border-r border-border p-4 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none">
          <ShellSidebarNav items={CREATOR_NAV} />
        </aside>
        {/* Main */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
          <div className="mx-auto max-w-[1280px] w-full">{children}</div>
        </main>
        {/* Right rail (desktop, optional) */}
        {rightRail && (
          <aside className="hidden xl:flex shrink-0 w-[320px] border-l border-border p-6 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-none">
            {rightRail}
          </aside>
        )}
      </div>
      <ShellMobileBar items={CREATOR_NAV_MOBILE} />
    </div>
  );
}
