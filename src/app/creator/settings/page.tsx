// /creator/settings — account, profile, theme + locale, role-add, sign out.

import { redirect } from 'next/navigation';
import { Briefcase, LogOut } from 'lucide-react';
import { Avatar, Badge, Button, Card } from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { fetchCreatorContext } from '@/lib/creator/queries';
import { addRoleAction, signOutAction } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

export default async function CreatorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchCreatorContext(user.id);
  if (!ctx) redirect('/login');

  const isAlreadyWorker = ctx.user.is_worker;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Settings</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Account, appearance, and roles.
        </p>
      </header>

      {/* Account */}
      <Section title="Account">
        <Card padding="lg">
          <div className="flex items-start gap-4">
            <Avatar src={ctx.user.avatar_url ?? undefined} name={ctx.user.full_name ?? ctx.user.email} size="xl" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-fg truncate">
                {ctx.user.full_name ?? ctx.user.email}
              </p>
              <p className="text-sm text-fg-muted truncate">{ctx.user.email}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ctx.user.is_creator && <Badge tone="brand">Creator</Badge>}
                {ctx.user.is_worker && <Badge tone="success">Worker</Badge>}
                {ctx.user.is_admin && <Badge tone="warning">Admin</Badge>}
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs text-fg-subtle leading-relaxed">
            Profile editing is coming in a later update. For now, email
            <a href="mailto:hello@highzcore.tech" className="text-brand font-semibold"> hello@highzcore.tech</a>
            {' '}if you need to change something.
          </p>
        </Card>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Card padding="lg" className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-fg">Theme</p>
            <p className="text-xs text-fg-muted mt-0.5">
              System follows your OS. Pick a specific theme to override.
            </p>
          </div>
          <ThemeToggle />
        </Card>
      </Section>

      {/* Add the worker role */}
      <Section title="Other roles">
        <Card padding="lg">
          {isAlreadyWorker ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-fg">You're also a worker</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Earnings + tasks live on the worker dashboard.
                </p>
              </div>
              <a href="/worker" className="text-sm font-semibold text-brand">
                Open worker dashboard →
              </a>
            </div>
          ) : (
            <form action={async () => { 'use server'; await addRoleAction('worker'); }}>
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--c-product-promote)_14%,transparent)] text-[var(--c-product-promote)] shrink-0">
                  <Briefcase className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-fg">Earn as a worker too</p>
                  <p className="text-sm text-fg-muted mt-1 leading-relaxed">
                    Watch videos and give feedback on other creators' projects. Get paid in USDT,
                    withdrawable from $10. Adding the role doesn't affect your creator account.
                  </p>
                  <div className="mt-4">
                    <Button type="submit">Become a worker</Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </Card>
      </Section>

      {/* Sign out */}
      <Section title="Session">
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" leftIcon={<LogOut className="h-4 w-4" />}>
            Sign out
          </Button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}
