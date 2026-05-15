// /worker/settings — account, USDT address, audiences link, theme, role-add, sign out.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Sparkles, Wallet } from 'lucide-react';
import { Avatar, Badge, Button, Card } from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { fetchWorkerContext } from '@/lib/worker/queries';
import { addRoleAction, signOutAction } from '@/lib/auth/actions';
import { UsdtAddressForm } from './UsdtAddressForm';

export const dynamic = 'force-dynamic';

export default async function WorkerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const isAlreadyCreator = ctx.user.is_creator;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Settings</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Account, payouts, appearance, and roles.
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
                <Badge tone="info">Tier {ctx.profile.tier}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Payout — USDT TRC20 */}
      <Section title="Payouts">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-start gap-3">
            <Wallet className="h-5 w-5 text-fg-muted mt-1 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">USDT TRC20 address</p>
              <p className="text-xs text-fg-muted leading-relaxed">
                Where withdrawals are sent. Edit anytime — changes only apply to future withdrawals.
              </p>
            </div>
          </div>
          <UsdtAddressForm initial={ctx.profile.usdt_trc20_address ?? ''} />
        </Card>
      </Section>

      {/* Audiences link */}
      <Section title="Promote audiences">
        <Card padding="lg" className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-fg-muted" />
            <div>
              <p className="text-sm font-semibold text-fg">External accounts</p>
              <p className="text-xs text-fg-muted">
                Link Twitter / IG / TikTok / Telegram accounts to unlock Promote tasks.
              </p>
            </div>
          </div>
          <Link href="/worker/audiences" className="text-sm font-semibold text-brand">
            Manage →
          </Link>
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

      {/* Add the creator role */}
      <Section title="Other roles">
        <Card padding="lg">
          {isAlreadyCreator ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-fg">You're also a creator</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Your projects + reports live on the creator dashboard.
                </p>
              </div>
              <a href="/creator" className="text-sm font-semibold text-brand">
                Open creator dashboard →
              </a>
            </div>
          ) : (
            <form action={async () => { 'use server'; await addRoleAction('creator'); }}>
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--c-product-insights)_14%,transparent)] text-[var(--c-product-insights)] shrink-0">
                  <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-fg">Grow a channel too?</p>
                  <p className="text-sm text-fg-muted mt-1 leading-relaxed">
                    Add the creator role and run Insights + AB tests on your own videos. Same
                    account, no extra signup.
                  </p>
                  <div className="mt-4">
                    <Button type="submit">Become a creator</Button>
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
